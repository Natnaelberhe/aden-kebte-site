# make_favicon.py
import base64, pathlib

b64 = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAfCAYAAAD4cU1WAAAACXBIWXMAAAsSAAALEgHS3X78AAAAFklEQVQImWP4//8/"
       "AwMDAwMjIyMAAQYAAG0Yx2s6Cw0yAAAAAElFTkSuQmCC")

assets = pathlib.Path("assets")
assets.mkdir(exist_ok=True)
(assets / "favicon-32.png").write_bytes(base64.b64decode(b64))
print("Wrote assets/favicon-32.png")
