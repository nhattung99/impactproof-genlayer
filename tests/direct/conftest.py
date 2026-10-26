# genlayer-test registers its direct fixtures through pytest entry points.
import os
from unittest.mock import patch
import pytest


@pytest.fixture(autouse=True)
def windows_stdin_file_lifetime(monkeypatch):
    """gltest 0.29.2 unlinks fd0's backing file while open (POSIX behavior).

    On Windows defer only that cleanup until the VM restores stdin. Contract
    code, storage, encoding, web and consensus behavior are untouched.
    """
    if os.name != "nt":
        yield
        return
    from gltest.direct import loader
    original = loader._inject_message_to_fd0
    unlink = os.unlink
    deferred = []

    def defer_locked_file(path, *args, **kwargs):
        try:
            unlink(path, *args, **kwargs)
        except PermissionError as error:
            if error.winerror != 32:
                raise
            deferred.append(path)

    def inject(vm):
        with patch("os.unlink", defer_locked_file):
            original(vm)

    monkeypatch.setattr(loader, "_inject_message_to_fd0", inject)
    yield
    for path in deferred:
        unlink(path)
