from collections.abc import Sequence, Mapping
from collections import UserList

class ReturnValue:
    def __init__(self, v=None, err=None):
        if v is not None and err is not None:
            raise ValueError("cannot have value and error")
        self._value = v
        self._error = err

    @property
    def type(self):
        if self._value is not None:
            return "VALUE"
        if self._error is not None:
            return "ERROR"
        return "EMPTY"

    @property
    def value(self):
        if self._error is not None:
            raise self._error
        if self._value is None:
            raise ValueError("Empty return value")
        return self._value

_command_map = dict()

class Command:
    def __init__(self, name, desc, func, args, help):
        self.name = name
        self.desc = desc
        self.func = func
        self.args = args
        self.extra_help = help

    @property
    def compact_help(self):
        return ("{name} {arguments} - {description}"
                .format(name=self.name,
                        arguments=str(self.args),
                        description=self.desc))

    @property
    def help(self):
        s = self.compact_help
        if self.extra_help:
            join_str = '\n    '
            s += join_str
            if isinstance(self.extra_help, (str, bytes)):
                s += self.extra_help
            else:
                s += join_str.join(self.extra_help)
        return s

    def execute(self, args):
        length_min = sum(1 for a in self.args if not a.optional)
        length_max = len(self.args)
        if len(args) < length_min or len(args) > length_max:
            raise ValueError("Arguments '{}' do not fit {}"
                             .format(' '.join('"' + s + '"' for s in args), self.args))
        return self.func(*args)

class ArgumentList(UserList):
    def __init__(self, *args):
        if len(args) == 1 and isinstance(args[0], Sequence):
            args = tuple(args[0])
        UserList.__init__(self, args)
        for i in range(len(self.data)):
            self.data[i] = Argument.convert(self.data[i])

    def __str__(self):
        return ' '.join(map(str, self.data))


def _str_convert(a):
    def kv_gen(l):
        for x in l:
            yield (tuple(x.split('=', 1))
                   if '=' in x else
                   (x, True))
    attr_list = a.split(',')
    attrs = dict(kv_gen(attr_list))
    if len(attrs) == 1:
        return Argument(a)
    args = {'name': attr_list[0]}
    del attrs[attr_list[0]] # Remove name from list.
    def detect(a, conv=None):
        if a in attrs:
            v = attrs[a]
            del attrs[a] # delete for check after
            if conv is not None:
                v = conv(v)
            args[a] = v
    detect('optional')
    detect('implies', lambda s: ArgumentList([s.strip() for s in s.split('|')]))
    if attrs:
        raise ValueError("Unexpected attributes: {}".format(attrs))
    return Argument(**args)

class Argument:
    @staticmethod
    def convert(a):
        if isinstance(a, Argument):
            return a
        if isinstance(a, str):
            return _str_convert(a)
        if isinstance(a, Sequence):
            return Argument(*a)
        if isinstance(a, Mapping):
            return Argument(**a)
        raise ValueError("Couldn't convert {} to an argument!".format(a))

    def __init__(self, name, optional=False, implies=None):
        self.name = name
        self.optional = bool(optional)
        self.implies = None if implies is None else tuple(implies)

    def __str__(self):
        inner_text = self.name
        if self.implies:
            inner_text += " " + ' '.join(map(str, self.implies))
        return ('[{}]' if self.optional else '<{}>').format(inner_text)

    def __repr__(self):
        args = [repr(self.name)]
        if self.optional:
            args.append('optional=' + repr(self.optional))
        if self.implies is not None:
            args.append('implies=' + repr(self.implies))
        return self.__class__.__name__ + '({})'.format(', '.join(args))

def execute(name, args):
    try:
        v = _command_map[name].execute(args)
        if isinstance(v, ReturnValue):
            return v
        return ReturnValue(v)
    except Exception as e:
        return ReturnValue(err=e)

_confirm_set = set('yY')
#### Command helper functions
def confirm(prompt):
    confirm = input(str(prompt) + " [y/N]: ")
    return confirm in _confirm_set

def command(name, desc, args=[], help=None):
    def register_func(f):
        _command_map[name] = Command(name, desc, f, ArgumentList(args), help)
    return register_func

@command(
    name='help',
    desc='Provides help for commands',
    args=['--all,optional'],
    help='Use --all for more.')
def generate_help(all_help=False):
    all_help = all_help == '--all'
    print('Help:')
    for name, cmd in sorted(_command_map.items(), key=lambda data: data[0]):
        if all_help:
            print(cmd.help)
        else:
            print(cmd.compact_help)
