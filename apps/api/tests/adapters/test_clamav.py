"""The clamd INSTREAM client against a fake clamd on a local socket."""

import asyncio
import struct

import pytest

from app.adapters.clamav import ClamdScanner, ScanError, parse_reply


async def _fake_clamd(reply: bytes, received: list):
    async def handle(reader, writer):
        assert await reader.readuntil(b"\0") == b"zINSTREAM\0"
        data = b""
        while True:
            (size,) = struct.unpack("!L", await reader.readexactly(4))
            if size == 0:
                break
            data += await reader.readexactly(size)
        received.append(data)
        writer.write(reply)
        await writer.drain()
        writer.close()

    server = await asyncio.start_server(handle, "127.0.0.1", 0)
    return server, server.sockets[0].getsockname()[1]


@pytest.mark.parametrize(
    ("reply", "clean", "signature"),
    [
        (b"stream: OK\0", True, None),
        (b"stream: Eicar-Test-Signature FOUND\0", False, "Eicar-Test-Signature"),
    ],
)
async def test_streams_the_file_and_reads_the_verdict(reply, clean, signature):
    received: list = []
    server, port = await _fake_clamd(reply, received)
    data = bytes(range(256)) * 1000  # 256 KB: several INSTREAM chunks
    async with server:
        result = await ClamdScanner(host="127.0.0.1", port=port).scan(data)
    assert received == [data]
    assert (result.clean, result.signature) == (clean, signature)


async def test_a_clamd_error_fails_closed():
    server, port = await _fake_clamd(b"INSTREAM size limit exceeded. ERROR\0", [])
    async with server:
        with pytest.raises(ScanError):
            await ClamdScanner(host="127.0.0.1", port=port).scan(b"x")


async def test_an_unreachable_clamd_fails_closed():
    server = await asyncio.start_server(lambda r, w: None, "127.0.0.1", 0)
    port = server.sockets[0].getsockname()[1]
    server.close()
    await server.wait_closed()
    with pytest.raises(ScanError):
        await ClamdScanner(host="127.0.0.1", port=port, timeout=2).scan(b"x")


def test_parse_reply():
    assert parse_reply(b"stream: OK\0").clean
    assert parse_reply(b"stream: Win.Trojan.Agent-1 FOUND\0").signature == "Win.Trojan.Agent-1"
    with pytest.raises(ScanError):
        parse_reply(b"garbage")
