# <img src="public/icons/icon_48.png" width="45" align="left"> Супер Успели!

> Расширение для сохранения удалённых комментариев с Pikabu.

## Установка
Справа есть [releases](https://github.com/shanginn/pikabu-super-uspeli-extension/releases),
там качайте архив с последней версией расширения super-uspeli-v*.zip

И закидывайте его в расширения хрома в режиме разработчика.

Дальше всё должно работать автоматом

## Сервер
В качестве сервера выступает почти голый [SurrealDB](https://surrealdb.com/),
развёрнутый на бесплатном плане [fly.io](https://fly.io)

Чтобы повторить у себя, [установите SurrealDB](https://surrealdb.com/install), залогиньтесь:
```bash
surreal sql --conn $URL --user $USER --pass $PASSWORD --ns pikabu --db super-uspeli --pretty
```

И запустите (поочереди?) эти команды:
```
DEFINE SCOPE allusers
SESSION 1d
SIGNUP (
  CREATE type::thing("user", string::lowercase(string::trim($user)))
  SET pass = crypto::argon2::generate($pass)
)
SIGNIN (
  SELECT * FROM type::thing("user", string::lowercase(string::trim($user)))
  WHERE crypto::argon2::compare(pass, $pass)
)

DEFINE TABLE comments SCHEMALESS;
DEFINE FIELD id ON TABLE comments TYPE string ASSERT $value != NONE;
DEFINE FIELD text ON TABLE comments TYPE string ASSERT $value != NONE;
DEFINE INDEX id ON TABLE comments COLUMNS id UNIQUE;
```
## Ахтунг

Расширение в глубочайшей альфе, поэтому не удивляйтесь, если что-то не будет работать.

---

This project was bootstrapped with [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli)

