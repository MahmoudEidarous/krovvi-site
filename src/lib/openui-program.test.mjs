import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addressOf, partsIn, PROPS, readProgram, tileRows, wordsOf } from './openui-program.mjs';

const SEEN = `
root = Card([must], "Don't miss")
must = List([Item("Miradouro de Santa Luzia", "The whole old town and the river from one terrace. Go at sunset.", null, "https://example.com/view.jpg", "My pick"), Item("Tram 28", "Ride it early, before the queues.", null, "https://example.com/tram.jpg")])
`;

test('a card of rows with pictures: each row its name, its line, its picture and the word that marks it', () => {
  const root = readProgram(SEEN);
  assert.equal(root.part, 'Card');
  assert.equal(root.props.title, "Don't miss");
  const list = partsIn(root.props.children, 'List')[0];
  const items = partsIn(list.props.items, 'Item');
  assert.deepEqual(items.map((i) => [i.props.title, i.props.picture, i.props.badge ?? null]), [
    ['Miradouro de Santa Luzia', 'https://example.com/view.jpg', 'My pick'],
    ['Tram 28', 'https://example.com/tram.jpg', null],
  ]);
  assert.equal(items[0].props.icon, null);
  assert.equal(items[0].props.detail, 'The whole old town and the river from one terrace. Go at sunset.');
});

test('each thing as a tile: its picture, its name and a line on it, in a group under its heading', () => {
  const root = readProgram('root = Card([g])\ng = Gallery([Picture("https://example.com/a.jpg", "Wide leg", "A shop", "Loose from the hip down. Good with a fitted top."), Picture("https://example.com/b.jpg", "Straight", "", "The same width all the way.")], "Relaxed fits")\n');
  const gallery = partsIn(root.props.children, 'Gallery')[0];
  assert.equal(gallery.props.title, 'Relaxed fits');
  assert.deepEqual(partsIn(gallery.props.pictures, 'Picture').map((p) => p.props.text), ['Loose from the hip down. Good with a fitted top.', 'The same width all the way.']);
});

test('pictures side by side: each with its words, a card with no name', () => {
  const root = readProgram('root = Card([more])\nmore = Gallery([Picture("https://example.com/a.jpg", "Belém Tower", "Wikimedia Commons"), Picture("https://example.com/b.jpg", "Fado in Alfama")])\n');
  assert.equal(root.props.title, undefined);
  const pictures = partsIn(partsIn(root.props.children, 'Gallery')[0].props.pictures, 'Picture');
  assert.deepEqual(pictures.map((p) => p.props), [
    { src: 'https://example.com/a.jpg', caption: 'Belém Tower', source: 'Wikimedia Commons' },
    { src: 'https://example.com/b.jpg', caption: 'Fado in Alfama' },
  ]);
});

test('a value a person can change is read as it was first set; a sum the app works out is nothing; the rest still reads', () => {
  const program = [
    'root = Card([focus, flats, total, more], "Three flats")',
    '$focus = "commute"',
    'focus = Choice("focus", "What matters most", [Opt("Price", "price"), Opt("Commute", "commute")], $focus)',
    'flats = Compare([a, g], $focus)',
    'a = Pick("Avenidas 3-bed", ["96 m²", "Lift"], "https://example.com/lx.jpg", "$1,690/mo", "Shortest commute", "https://example.com/avenidas", {price: 4, commute: 10})',
    'g = Pick("Graça 2-bed", ["78 m²"], null, "$1,450/mo")',
    'total = Stat("Monthly", @Money(@Payment(200000, 7.5, 240), "$"))',
    'more = Buttons([Button("Open the listing", @OpenUrl("https://example.com/avenidas"), "secondary")])',
  ].join('\n');
  const root = readProgram(program);
  const [choice, compare, stat, buttons] = root.props.children;
  assert.equal(choice.props.value, 'commute');
  assert.equal(compare.props.focus, 'commute');
  const picks = partsIn(compare.props.items, 'Pick');
  assert.deepEqual(picks[0].props.points, ['96 m²', 'Lift']);
  assert.equal(picks[0].props.picture, 'https://example.com/lx.jpg');
  assert.equal(picks[0].props.link, 'https://example.com/avenidas');
  assert.equal(picks[0].props.scores, null);
  assert.equal(picks[1].props.picture, null);
  assert.equal(stat.props.label, 'Monthly');
  assert.equal(stat.props.value, null);
  assert.equal(partsIn(buttons.props.items, 'Button')[0].props.label, 'Open the listing');
  assert.equal(partsIn(buttons.props.items, 'Button')[0].props.action, null);
});

test('a table, figures and steps keep their numbers and their order; a statement over several lines reads whole', () => {
  const program = 'root = Card([t, s, st])\nt = Table(["Desk", "Range"], [\n  ["E7 Pro", "25 to 50 in"],\n  ["E5", 49.2]\n], "Prices move")\ns = Stats([Stat("Left", 3700, "$", "After costs", "up"), Stat("Users", "10,000")])\nst = Steps([Step("Wake", "06:30", 10), Step("Walk")], true)\n';
  const root = readProgram(program);
  const [table, stats, steps] = root.props.children;
  assert.deepEqual(table.props.columns, ['Desk', 'Range']);
  assert.deepEqual(table.props.rows, [['E7 Pro', '25 to 50 in'], ['E5', 49.2]]);
  assert.equal(table.props.caption, 'Prices move');
  assert.deepEqual(partsIn(stats.props.items).map((x) => [x.props.label, x.props.value, x.props.unit ?? null, x.props.trend ?? null]), [['Left', 3700, '$', 'up'], ['Users', '10,000', null, null]]);
  assert.equal(steps.props.walk, true);
  assert.deepEqual(partsIn(steps.props.items).map((x) => [x.props.title, x.props.minutes ?? null]), [['Wake', 10], ['Walk', null]]);
});

test('words in single quotes, an escape, a comment, Arabic: read as written', () => {
  const root = readProgram("// a note\nroot = Card([n], 'ماتفوتهمش')\nn = Note(\"He said \\\"go\\\" at 5\\nthen left\", \"tip\")\n");
  assert.equal(root.props.title, 'ماتفوتهمش');
  assert.equal(root.props.children[0].props.text, 'He said "go" at 5\nthen left');
  assert.equal(root.props.children[0].props.tone, 'tip');
});

test('a block that cannot be read never breaks the page: no root, a part nobody knows, a name that points at itself, words never closed', () => {
  assert.equal(readProgram(''), null);
  assert.equal(readProgram('x = Card([])'), null);
  assert.equal(readProgram('root = Nope("a")'), null);
  assert.equal(readProgram('root = "only words"'), null);
  assert.equal(readProgram(null), null);
  const loop = readProgram('root = Card([a])\na = a\n');
  assert.deepEqual(loop.props.children, [null]);
  const cut = readProgram('root = Card([l], "Kept")\nl = List([Item("One"), Item("Two, never closed');
  assert.equal(cut.props.title, 'Kept');
  const unknownInside = readProgram('root = Card([a, b])\na = Nope("x")\nb = Text("still here")\n');
  assert.deepEqual(unknownInside.props.children.map((c) => (c ? c.part : null)), [null, 'Text']);
});

test('more arguments than a part has props are left out, and every part the app knows is known here', () => {
  const root = readProgram('root = Card([p])\np = Picture("https://example.com/a.jpg", "A", "Site", "A line on it.", "a later prop", "another")\n');
  assert.deepEqual(Object.keys(root.props.children[0].props), ['src', 'caption', 'source', 'text']);
  for (const name of ['Card', 'Tabs', 'Text', 'Note', 'Stats', 'Progress', 'Chart', 'Table', 'Slider', 'Choice', 'Toggle', 'Field', 'Form', 'Checklist', 'Steps', 'Timeline', 'Flow', 'Diagram', 'List', 'Compare', 'Gallery', 'Thing', 'Buttons', 'FollowUps']) assert.ok(PROPS[name], name);
  assert.deepEqual(PROPS.Item, ['title', 'detail', 'icon', 'picture', 'badge']);
  assert.deepEqual(PROPS.Picture, ['src', 'caption', 'source', 'text']);
  assert.deepEqual(PROPS.Gallery, ['pictures', 'title']);
});

test('what a part shows: words trimmed, a figure as its number, an address only when it is https', () => {
  assert.equal(wordsOf('  hi  '), 'hi');
  assert.equal(wordsOf(12), '12');
  assert.equal(wordsOf(null), '');
  assert.equal(addressOf(' https://example.com/a.jpg '), 'https://example.com/a.jpg');
  assert.equal(addressOf('http://example.com/a.jpg'), null);
  assert.equal(addressOf('javascript:alert(1)'), null);
  assert.equal(addressOf('https://example.com/a b.jpg'), null);
  assert.equal(addressOf(7), null);
});

test('pictures stand as the app stands them: two side by side, three across, four as a square, two over three, two rows of three', () => {
  // Two side by side, always, up to eight; an odd last one keeps its half of the row (the app's rule since 17 November 2026).
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 8, 11].map(tileRows), [[], [], [2], [2, 1], [2, 2], [2, 2, 1], [2, 2, 2], [2, 2, 2, 2], [2, 2, 2, 2]]);
});
