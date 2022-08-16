/**
 * Добавление элемента в упорядоченный плоский список.
 * Элементы добавляются рекурсивно по принципу:
 * 'родитель 1','потомок 1.1 ', 'потомок 1.2', 'потомок 1.n', 'родитель 2', 'потомок 2.1', 'потомок 2.n'
 *
 * @param      {Object}          items   Объект с элементами списка вида {[id]:[элеменет]}
 * @param      {string}          key     Ключ текущего элемента
 * @param      {Array}  list    Список элементов
 */
export function addToList(items, key, list) {
  const item = items[key];

  if (!item) return;
  // Проверяем, что элемент не прямой потомок корневого элемента
  // Это значит, что у элемента есть родитель
  if (item.track.length > 1) {
    const parentIndex = list.indexOf(
      item.track[item.track.length - 1].toString()
    );
    // Если родитель элемента ещё не добавлен в список, то не нужно добавлять текущий элемент:
    // он будет добавлен позже, при обходе детей его родителя
    if (parentIndex === -1) {
      return;
    }
    // Если элемент уже есть в списке, его не надо добалять
    const index = list.indexOf(key.toString());
    if (index > -1) {
      return;
    }
  }

  list.push(key.toString());

  if (item.children && item.children.length) {
    // Рекурсивно обходим детей текущего элемента
    item.children.forEach((id) => {
      addToList(items, id, list);
    });
  }
}

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
  if (typeof firstItem[sortField] === 'string') {
    if (
      secondItem[sortField].toLowerCase() > firstItem[sortField].toLowerCase()
    ) {
      return -1
    } else {
      return 1
    }
  } else {
    return firstItem[sortField] - secondItem[sortField]
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
  Object.keys(items).forEach(id => {
    if (!isNaN(id)) {
      id = parseInt(id)
    }
    if (items[id]?.track && items[id].track.length > 1) {
      const parent = items[items[id].track[items[id].track.length - 1]]
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        if (!parent.children.includes(id)) {
          parent.children.push(id)
        }
      }
    }
  })
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
  items = {},
  parent = null
) {
  items[item.id] = item;
  if (parent) {
    item.track = [...parent.track];
    item.track.push(parent.id);
  } else {
    item.track = [];
  }
  if (item[childrenField]) {
    item[childrenField].forEach((childItem) => {
      makeItems(childItem, childrenField, items, item);
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
    const firstItem = itemsObj[firstKey]
    const secondItem = itemsObj[secondKey]
    if (!firstItem || !secondItem) return 1
    if (firstItem.children) {
      sort(secondItem.children, itemsObj, sortField, compareFunction)
    }
    if (firstItem[sortField] && secondItem[sortField]) {
      if (typeof compareFunction === 'function') {
        return compareFunction(compareDefault, sortField, firstItem, secondItem)
      }
      return compareDefault(sortField, firstItem, secondItem)
    } else {
      return 1
    }
  })
}
