import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from refact_utils.scripts.env import safe_paths_join


__all__ = ["StaticRouter"]


class StaticRouter(APIRouter):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        super().add_api_route("/", self._index, methods=["GET"])
        super().add_api_route("/{file_path:path}", self._static_file, methods=["GET"])
        super().add_api_route("/ping", self._ping_handler, methods=["GET"])
        self.static_folders = [
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "static"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "assets")
        ]

    async def _index(self):
        for spath in self.static_folders:
            fn = os.path.join(spath, "index.html")
            if os.path.exists(fn):
                return FileResponse(fn, media_type="text/html")
        raise HTTPException(404, "No index.html found")

    async def _static_file(self, file_path: str):
        for spath in self.static_folders:
            try:
                fn = safe_paths_join(spath, file_path)
            except ValueError as e:
                raise HTTPException(404, str(e))
            if os.path.exists(fn):
                if fn.endswith(".cjs"):
                    return FileResponse(fn, media_type="text/javascript")
                else:
                    return FileResponse(fn)
        raise HTTPException(404, "Path \"%s\" not found" % file_path)

    async def _ping_handler(self):
        return {"message": "pong"}
