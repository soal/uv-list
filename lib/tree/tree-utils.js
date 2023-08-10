/**
 * Функция сравнения, используемая по-умолчанию.
 * Предназначена для передачи во встроенный метод Array.sort()
 * Сортирует элементы по значению поля, переданного в sortField.
 * Умеет сравнивать значения типов String и Number.
 *
 * @param      {<type>}  sortField   Поле, по значению которого сортировать
 * @param      {<type>}  firstItem   Первый элемент
 * @param      {<type>}  secondItem  Второй элемент
 * @return     {number}  1 если первый элемент больше второго и -1 если наоборот
 */
export function compareDefault(sortField, firstItem, secondItem) {
  if (
    typeof firstItem[sortField] === "string" ||
    typeof firstItem[sortField] === "string"
  ) {
    if (
      secondItem[sortField].toString().toLowerCase() >
      firstItem[sortField].toString().toLowerCase()
    ) {
      return -1;
    } else {
      return 1;
    }
  } else {
    return firstItem[sortField] - secondItem[sortField];
  }
}

/**
 * Нормализует элементы для работы в PbVirtualTree.
 * Получает родителя переданного элемента и добавляет текущий в его поле children
 * Изменяет переданный массив элементов.
 *
 * @param      {Object}  items Объект, где ключ — id элемента, а значение — объект элемента
 */
export function normalizeChildrenByTrack(items) {
  const keys = Object.keys(items);
  for (let id of keys) {
    if (!isNaN(id)) {
      id = parseInt(id);
    }
    if (items[id]?.track?.length > 1) {
      const parent = items[items[id].track[items[id].track.length - 1]];
      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        if (!parent.children.indexOf(id) !== -1) {
          parent.children.push(id);
        }
      }
    }
  }
}
/**
 * Возвращает список, обработанный для использования в компоненте.
 * Рекурсивно обходит переданный объект и его дочерние элементы
 * и формирует поле track, в котором описа путь элмента в иерархии
 *
 * @param      {Object}  item                        Корневой элемент
 * @param      {string}  [childrenField='children']  Поле, в котором содержится список id дочерних элементов
 * @param      {Object}  [items={}]                  Объект, содержащий элменты
 * @param      {Object}  [parent=null]               Родительский элемент
 * @return     {Object}  Обработынное дерево элементов с добавленным полем track
 */
export function makeItems(
  item,
  childrenField = "children",
  idField = "id",
  items = {},
  parent = null,
) {
  items[item[idField]] = item;
  if (parent) {
    item.track = [...parent.track];
    item.track.push(parent.id);
  } else {
    item.track = [];
  }
  if (item[childrenField]) {
    item[childrenField].forEach((childItem) => {
      makeItems(childItem, childrenField, idField, items, item);
    });
    item[childrenField] = item.children.map(({ id }) => id);
  }
  return items;
}

/**
 * Сортирует элементы, переставляя дочерние элементы сразу после родительских.
 *
 * @param      {Array}    itemsKeys                 Ключи списка (обычно списко id элментов)
 * @param      {Object}    itemsObj                 Объект с элементами, где ключи — id элементов
 * @param      {string | number}    sortField       Поле, по которому сортировать элементы
 * @param      {Function}  [compareFunction=null]   Функция сравнения
 */
export function sort(itemsKeys, itemsObj, sortField, compareFunction = null) {
  itemsKeys.sort((firstKey, secondKey) => {
    const firstItem = itemsObj[firstKey];
    const secondItem = itemsObj[secondKey];
    if (!firstItem || !secondItem) return 1;
    if (firstItem.children?.length) {
      sort(secondItem.children, itemsObj, sortField, compareFunction);
    }
    if (firstItem[sortField] && secondItem[sortField]) {
      if (typeof compareFunction === "function") {
        return compareFunction(
          compareDefault,
          sortField,
          firstItem,
          secondItem,
        );
      }
      return compareDefault(sortField, firstItem, secondItem);
    } else {
      return 1;
    }
  });
}
/**
 * Добавление элемента в упорядоченный плоский список.
 * Элементы добавляются рекурсивно по принципу:
 * 'родитель 1','потомок 1.1 ', 'потомок 1.2', 'потомок 1.n', 'родитель 2', 'потомок 2.1', 'потомок 2.n'
 *
 * @param      {Object}          items   Объект с элементами списка вида {[id]:[элеменет]}
 * @param      {string}          key     Ключ текущего элемента
 * @param      {Array}  list    Список элементов
 */
export function addToList(items, key, idList, itemList) {
  // console.count("addToList CALL")
  const sKey = key.toString();
  const item = items[sKey];
  if (!item) return;

  // Если элемент уже есть в списке, его не надо добавлять
  if (idList.indexOf(sKey) > -1) return;

  // console.count("addToList FRESH")
  // Проверяем, что элемент не прямой потомок корневого элемента
  // Это значит, что у элемента есть родитель
  if (item.track.length > 1) {
    // Если родитель элемента ещё не добавлен в список, то не нужно добавлять текущий элемент:
    // он будет добавлен позже, при обходе детей его родителя
    if (idList.indexOf(item.track[item.track.length - 1].toString()) === -1) {
      return;
    }
  }

  idList.push(sKey);

  itemList.push(item);

  // Рекурсивно обходим детей текущего элемента
  for (let i = 0; i < item.children.length; i++) {
    const id = item.children[i];
    if (idList.indexOf(id.toString()) > -1) continue;
    addToList(items, id, idList, itemList);
  }
}
/**
 * Создаёт список элментов, отсортированный по связям родительских с дочерними и полю sortField
 *
 * @param      {Object}           items      Объект с элементами, где ключи — id элементов
 * @param      {string | number}  sortField  Поле, по которому сортировать элементы
 * @param      {(sortField, firstItem, secondItem ) => number} compareFunction Функция сравнения
 * @return     {Array}  Отсортированный массив элементов
 */
export function makeList(items, sortField, compareFunction) {
  const itemsKeys = Object.keys(items);
  sort(itemsKeys, items, sortField, compareFunction);
  const idList = [];
  const itemList = [];
  for (let i = 0; i < itemsKeys.length; i++) {
    const id = itemsKeys[i];
    addToList(items, id, idList, itemList);
  }
  return itemList;
}

/**
 * Функция поиска по-умолчанию
 * Принимает список предикатов и проверяет каждый элемент списка.
 * Элемент считается прошедшим проверку, если все предикаты возвращают true
 *
 * @param      {Object}  argumants
 * @param      {Array}  argumants.list        Список
 * @param      {Object}  argumants.items      Объект всех элементов
 * @param      {Function[]}  [arg1.predicates=[]]  Список функций-предикатов
 * @return     {Array}   Отфилтрованный список
 */
export function defaultSearch({ list, items, predicates = [] }) {
  const filtered = [];
  const usedItems = {};
  for (let item of list) {
    const check = predicates.reduce((acc, predicate) => {
      return acc && predicate(item);
    }, true);
    if (check) {
      if (item.track.length) {
        item.track.forEach((id) => {
          const itemFromTrack = items[id];
          if (itemFromTrack) {
            if (!usedItems[id]) {
              usedItems[id] = true;
              filtered.push(itemFromTrack);
            }
          }
        });
      }
      usedItems[item.id] = true;
      filtered.push(item);
    }
  }
  return filtered;
}

const SearchParamsDefault = () => ({
  enabled: true,
  autofocus: true,
  minimalQueryLength: 1,
  caseSensitive: false,
  fields: ["name", "label"],
  throttle: 300,
  useDefaultSearch: true,
  searchFunction: defaultSearch,
});

export const makeSearchParams = (params = {}) => ({
  ...params,
  ...SearchParamsDefault(),
});

/**
 * * Создаёт функцию-предикат, используемую для поиска.
 * По умолчанию предикат принимает item и проверяет вхождение значений
 * полей options.params.fields в переданный searchString
 *
 * @param      {Object}  options
 * @param      {string}  options.searchString          Строка для поиска
 * @param      {<type>}  [arg1.params={field:'name'}]  Параметры поиска
 * @return     {Boolean}  true если элемент проходит проверку, false — если нет
 */
export function makeDefaultPredicate({
  searchString,
  params = { fields: ["name"] },
}) {
  return (item) =>
    params.fields.reduce((acc, field) => {
      let fieldValue = item[field];
      if (!params.caseSensitive) {
        fieldValue = fieldValue ? fieldValue.toLowerCase() : null;
        searchString = searchString.toLowerCase();
      }
      return acc || !!(fieldValue && fieldValue.indexOf(searchString) !== -1);
    }, false);
}
