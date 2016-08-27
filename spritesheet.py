#!/usr/bin/env python3

from collections import UserDict
from pathlib import Path
import requests
import sys
import os
import json

sys.path.insert(0, './python-libs/')

import commandlib
from commandlib import execute, command, confirm

class FileIdMapEncoder(json.JSONEncoder):
     def default(self, obj):
         if isinstance(obj, FileIdMap):
             return obj.data
         # Let the base class default method raise the TypeError
         return json.JSONEncoder.default(self, obj)

class FileIdMap(UserDict):
    # TODO this can be optimized by using a different format
    # Or maybe multiple files.
    # JSON currently requires a full write of the map to save.
    def __init__(self, save_target):
        UserDict.__init__(self)
        self.path = None if isinstance(save_target, FileIdMap) else Path(save_target)
        self.parent = save_target if isinstance(save_target, FileIdMap) else None
        if self.path is None and self.parent is None:
            raise ValueError("Bad stuff in " + repr(save_target))
        self._initialized = False
        self._initialize_dict()
        self.save()

    def _initialize_dict(self):
        if self.path and self.path.exists():
            with self.path.open('r') as f:
                try:
                    self.update(json.load(f))
                except Exception:
                    # Print loading errors.
                    import traceback
                    traceback.print_exc()
        self._initialized = True

    def save(self):
        self._save(self.data)

    def _save(self, recover):
        # Cancel saves while loading...
        if not self._initialized:
            return
        if recover == None:
            raise Exception("Cannot save without recovery!")
        if self.parent:
            try:
                self.parent.save()
            finally:
                self._recover = None
            return
        def write(d):
            with self.path.open('w') as f:
                json.dump(d, f, indent=4, sort_keys=True, cls=FileIdMapEncoder)
        try:
            write(self.data)
        except Exception:
            if recover is not self.data:
                # Don't try to save the same data that failed.
                write(self._recover)

    def _hook(self, v):
        if isinstance(v, dict):
            m = FileIdMap(self)
            m.update(v)
            return m
        return v

    def __setitem__(self, k, v):
        recover = self.data
        self.data[k] = self._hook(v)
        self._save(recover)

    def __delitem__(self, k):
        recover = self.data
        self.data.__delitem__(k)
        self._save(recover)

    def __repr__(self):
        loc = ""
        if self.path:
            loc = "->" + str(self.path)
        return 'FileIdMap({})'.format(self.data) + loc

class Type:
    NORMAL = 'normal'
    NEWLINE = 'newline'

SPRITELIST = 'spriteList'
TRACKER_FILE = Path('spritesheets/data.json')
d = None

def get_sheet_dir(sheet, create=True):
    p = Path('spritesheets')/sheet
    if create and not p.exists():
        p.mkdir(exist_ok=True)
    return p

def url_or_file_content(path):
    if path.startswith('http://') or path.startswith('https://'):
        res = requests.get(path)
        res.raise_for_status()
        return res.content
    filepath = Path(filepath).absolute()
    if not filepath.exists():
        raise ValueError("File doesn't exist: " + str(filepath))
    return filepath.read_bytes()

@command(
    name='add',
    desc='Add a sprite named <name> at <filepath> to <sheet>',
    args=['sheet', 'name', 'filepath'],
    help=['Sprites will be denied if they do not match the size of the sheet',
          'or if there is already a sprite linked to <name>.'])
def add_path(sheet, name, filepath):
    s = d[sheet] if sheet in d else dict()
    sprites = s[SPRITELIST] if SPRITELIST in s else []
    for t in sprites:
        if t.get('name', '') == name:
            print("{name} is already contained in the registry.".format(**t))
            sys.exit(2)

    (get_sheet_dir(sheet)/(name + '.png')).write_bytes(url_or_file_content(filepath))
    sprites.append({
        'name': name,
        'type': Type.NORMAL
    })
    s[SPRITELIST] = sprites
    d[sheet] = s
    print("{} is now registered as ID {}".format(name, len(sprites) - 1))

@command(
    name='update',
    desc='Updates a sprite named <name> to <filepath> in <sheet>',
    args=['sheet', 'name', 'filepath'],
    help='Sprites will be denied if they do not match the size of the sheet.')
def update_path(sheet, name, filepath):
    s = d[sheet] if sheet in d else dict()
    sprites = s[SPRITELIST] if SPRITELIST in s else []
    has = -1
    for x, t in enumerate(sprites):
        if t.get('name', '') == name:
            has = x
            break
    if has == -1:
        raise ValueError(name + " does not exist in '" + sheet + "'")

    (get_sheet_dir(sheet)/(name + '.png')).write_bytes(url_or_file_content(filepath))
    print("{} is now updated (ID {})".format(name, has))

@command(
    name='add-newline',
    desc='Adds an newline to <sheet>',
    args=['sheet'])
def add_newline(sheet):
    s = d[sheet] if sheet in d else dict()
    sprites = s[SPRITELIST] if SPRITELIST in s else []

    sprites.append({
        'type': Type.NEWLINE
    })

    s[SPRITELIST] = sprites
    d[sheet] = s
    print("Added a newline as ID {}".format(len(sprites) - 1))


@command(
    name='list',
    desc='Lists a variety of things. See `help --all` for more.',
    args=['sheet,optional'],
    help=['If [sheet] is present, lists tiles in the sheet.'
          'If it is not present, lists all sheets.']
)
def list_sheet(sheet=None):
    def get_items():
        if sheet is None:
            return [('sheet', k)  for i, k in enumerate(sorted(d.keys()))]
        l = d[sheet][SPRITELIST]
        return [(i, v['name']) for i, v in enumerate(l)]
    items = get_items()
    for name, cmd in items:
        print(name, '=', cmd)


@command(
    name='remove-sprite',
    desc='Remove the sprite named <name> from <sheet>',
    args=['sheet', 'name']
)
def remove_sprite(sheet, name):
    if sheet not in d:
        print("Warning: Sheet", sheet, "does not exist. Not deleting.")
        return
    (get_sheet_dir(sheet)/name + '.png').unlink()
    del d[sheet][name]


@command(
    name='remove-sheet',
    desc='Remove <sheet> and the corresponding files.',
    args=['sheet']
)
def remove_sprite(sheet):
    if sheet not in d:
        print("Warning: Sheet '" + sheet + "' does not exist. Not deleting.")
        return
    if not confirm("Are you sure you want to delete {}?".format(sheet)):
        print("Aborting.")
        return
    shdir = get_sheet_dir(sheet, create=False)
    if shdir.exists():
        for f in shdir.iterdir():
            f.unlink()
        shdir.rmdir()
    del d[sheet]
    print("Deleted", sheet)


@command(
    name='clear',
    desc='Completely wipes all data that exists.'
)
def clear_everything():
    if confirm("Are you sure you want to delete everything?"):
        d.clear()
        print('Deleted everything.')
    else:
        print("Aborting.")

def main(subcommand, args=sys.argv[2:]):
    global d
    if d is None:
        d = FileIdMap(TRACKER_FILE)
    ret_val = execute(subcommand, args)
    if ret_val.type != 'EMPTY':
        try:
            print(ret_val.value)
        except Exception as e:
            if os.environ.get('VERBOSE') == '1':
                raise
            if isinstance(e, KeyError) and e.args[0] == subcommand:
                print('Unknown command', subcommand)
            else:
                print(type(e).__name__ + ':', e)
            print()
            main('help', args=[])
            sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) == 1:
        print("Usage: ./spritesheet.py [action]")
        main('help')
        sys.exit(1)
    main(sys.argv[1])
