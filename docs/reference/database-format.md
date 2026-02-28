# Database Format

## Overview

Databases are stored in a single file using SQLite. This is a very common general-purpose database format, and there are many tools available to access it externally, such as [DB Browser for SQLite](https://sqlitebrowser.org/).

## Schemas

The database table structure is maintained in the project's source code repository. See the SQL creation files in the `src-tauri/` directory.

## Move Encoding

Rather than storing moves as readable text (which would consume excessive space), the application uses binary encoding. Each move is encoded as a single byte representing its position in the legal moves list.

The move list is generated with [Shakmaty](https://github.com/niklasf/shakmaty), and the encoded number is the index of the move in that list.

This compact encoding means each move takes only 1 byte of storage, making databases significantly smaller than PGN-based alternatives.

---

*This documentation is based on the original [En Croissant docs](https://www.encroissant.org/docs/) by [Francisco Salgueiro](https://github.com/franciscoBSalgueiro).*
