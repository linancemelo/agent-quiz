"""Quiz harness executed inside Pyodide. Not a server runner.

`_aq_run` execs learner code, optionally grades hidden tests, and returns JSON.
Network-ish imports fail for the duration of the call.
"""

import builtins
import io
import json
import sys
import traceback
from importlib.machinery import ModuleSpec

# Roots the learner must not import. `pyodide` itself stays available to the runtime;
# only `pyodide.http` is blocked below.
_BLOCK_ROOTS = frozenset(
    {
        "socket",
        "ssl",
        "urllib",
        "http",
        "xmlrpc",
        "ftplib",
        "smtplib",
        "poplib",
        "imaplib",
        "webbrowser",
        "subprocess",
        "multiprocessing",
        "micropip",
        "requests",
        "httpx",
        "aiohttp",
        "js",
    }
)


def _blocked_name(fullname):
    if fullname == "pyodide.http" or fullname.startswith("pyodide.http."):
        return True
    return fullname.split(".")[0] in _BLOCK_ROOTS


class _BlockedLoader:
    def __init__(self, name):
        self.name = name

    def create_module(self, spec):
        return None

    def exec_module(self, module):
        raise ImportError("沙盒不開網路或系統呼叫：" + self.name)


class _BlockedFinder:
    def find_spec(self, fullname, path, target=None):
        if _blocked_name(fullname):
            return ModuleSpec(fullname, _BlockedLoader(fullname))
        return None


_FINDER = _BlockedFinder()


def _install_blocks():
    saved = {}
    for name in list(sys.modules):
        if _blocked_name(name):
            saved[name] = sys.modules.pop(name)
    if _FINDER not in sys.meta_path:
        sys.meta_path.insert(0, _FINDER)
    return saved


def _restore_blocks(saved):
    try:
        sys.meta_path.remove(_FINDER)
    except ValueError:
        pass
    for name in list(sys.modules):
        if _blocked_name(name) and name not in saved:
            sys.modules.pop(name, None)
    saved_items = saved.items()
    for name, mod in saved_items:
        sys.modules[name] = mod


def _learner_traceback():
    """Drop harness frames so the learner sees their own code, not the runner."""
    kept = []
    for line in traceback.format_exc().splitlines():
        if "harness.py" in line or "_aq_" in line or "exec(code, ns, ns)" in line:
            continue
        kept.append(line)
    text = "\n".join(kept).strip()
    return text or traceback.format_exc()


def _cap(text, limit=8000):
    if text is None:
        return ""
    text = str(text)
    if len(text) <= limit:
        return text
    return text[:limit] + "\n…（輸出太長，已截斷）"


def _grade(ns, buf_out, buf_err, tests):
    results = []
    old_out, old_err = sys.stdout, sys.stderr
    sys.stdout = buf_out
    sys.stderr = buf_err
    try:
        for i, test in enumerate(tests):
            name = test.get("name") or ("第 %d 關" % (i + 1))
            kind = test.get("kind")
            try:
                if kind == "assert":
                    exec(test.get("code") or "", ns, ns)
                    results.append({"name": name, "passed": True, "message": "過關"})
                elif kind == "return":
                    got = eval(test.get("expr") or "", ns, ns)
                    expected = json.loads(test.get("expectedJson"))
                    if got != expected:
                        results.append(
                            {
                                "name": name,
                                "passed": False,
                                "message": "得到 %r，期望 %r" % (got, expected),
                            }
                        )
                    else:
                        results.append(
                            {"name": name, "passed": True, "message": "回傳正確"}
                        )
                elif kind == "stdout":
                    buf_out.seek(0)
                    buf_out.truncate(0)
                    exec(test.get("code") or "", ns, ns)
                    out = buf_out.getvalue().replace("\r\n", "\n").rstrip("\n")
                    raw_exp = test.get("expected")
                    exp = "" if raw_exp is None else str(raw_exp)
                    exp = exp.replace("\r\n", "\n").rstrip("\n")
                    if out != exp:
                        results.append(
                            {
                                "name": name,
                                "passed": False,
                                "message": "印出 %r，期望 %r" % (out, exp),
                            }
                        )
                    else:
                        results.append(
                            {"name": name, "passed": True, "message": "輸出正確"}
                        )
                else:
                    results.append(
                        {"name": name, "passed": False, "message": "未知的測試種類"}
                    )
            except Exception as exc:
                results.append(
                    {
                        "name": name,
                        "passed": False,
                        "message": "%s: %s" % (type(exc).__name__, exc),
                    }
                )
    finally:
        sys.stdout = old_out
        sys.stderr = old_err
    return results


def _aq_run(payload_json):
    try:
        data = json.loads(payload_json)
    except Exception as exc:
        return json.dumps(
            {
                "stdout": "",
                "stderr": "",
                "error": "無法讀取執行要求：" + str(exc),
                "tests": [],
            }
        )

    code = data.get("code") or ""
    mode = data.get("mode") or "run"
    tests = data.get("tests") or []
    ns = {"__builtins__": builtins, "__name__": "__main__"}
    buf_out = io.StringIO()
    buf_err = io.StringIO()
    saved = _install_blocks()
    stdout = ""
    stderr = ""
    user_error = None
    results = []
    try:
        old_out, old_err = sys.stdout, sys.stderr
        sys.stdout = buf_out
        sys.stderr = buf_err
        try:
            exec(code, ns, ns)
        except Exception:
            user_error = _learner_traceback()
        finally:
            sys.stdout = old_out
            sys.stderr = old_err
        stdout = buf_out.getvalue()
        stderr = buf_err.getvalue()
        if user_error is None and mode == "grade":
            results = _grade(ns, buf_out, buf_err, tests)
    finally:
        _restore_blocks(saved)

    return json.dumps(
        {
            "stdout": _cap(stdout),
            "stderr": _cap(stderr),
            "error": _cap(user_error) if user_error else None,
            "tests": results,
        }
    )
