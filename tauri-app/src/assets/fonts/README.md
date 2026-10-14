# Vendored font inventory

These nine binaries are existing repository assets. Do not download or replace
them as part of the study-interface foundation. The shipping font declarations
in `src/styles/fonts.css` currently use only the three Fira Sans WOFF2 files.
Fira Code and the remaining Fira Sans binaries are present but are not declared
by that sheet.

| File                     | SHA-256                                                            | Reviewed design archive match |
| ------------------------ | ------------------------------------------------------------------ | ----------------------------- |
| `FiraCode-Bold.woff`     | `3760314a6100f7c06569d7dbcb63c6be76e4c758d3119c0a1f4d0f2dfd64b59a` | Exact                         |
| `FiraCode-Medium.woff`   | `91f1c9c3eb82cca58221333684cf022e9169849c510158e9f162929d15286b66` | Exact                         |
| `FiraCode-Regular.woff`  | `e4b5a20d572b7f718d64c884e4e48cb7e45303ab50722011469ee2e1964bff6d` | Exact                         |
| `FiraSans-Bold.woff`     | `c5c453b7458a9580018061e5edd2dfd07dcf6aa90d7cef5206959b4945558f33` | No corresponding file         |
| `FiraSans-Bold.woff2`    | `811e73619cc2909792e8fa134c8d1ed714b898310dd4cc218fc29e40a5dc2890` | Exact                         |
| `FiraSans-Medium.ttf`    | `565ac3b27d1511d44bf3902eb19dca9f74f0873ff6c79b23ba6ac59708a2f22d` | No corresponding file         |
| `FiraSans-Medium.woff2`  | `8a76b4c523d2fcf672c0aa234e33e2c2dea66f11f328c74423d0f551a6fe5a65` | Exact                         |
| `FiraSans-Regular.woff`  | `ad36c2699507f8977a126374c6b7d6f180ed8d9b2244eaaa464f661f053289eb` | No corresponding file         |
| `FiraSans-Regular.woff2` | `7b8f0fbf813f59df6e7df17410a84850c3e690f98c90b9273371ef83796f8bc5` | Exact                         |

The six exact matches were compared with same-name entries under
`assets/fonts/` in `RAG/Color Tool Design System.zip`. No license/OFL record was
found in this font directory or the reviewed current design archive. That is a
repository-evidence gap, not a conclusion about upstream licensing, and it does
not authorize a network fetch or a new font. The proposed editorial serif
remains unapproved.
