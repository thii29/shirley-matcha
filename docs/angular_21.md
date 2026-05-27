Vietnam version
# Angular v21 Cheat Sheet — Principal Developer Edition

## Part 1: Deep-Dive into Advanced Reactivity & Core Shifts

## 1. Zoneless Angular trong v21: trạng thái production-ready

Trong Angular v21+, **Zoneless là mặc định**. Điều này có nghĩa là app Angular mới không còn cần `zone.js` để kích hoạt change detection. Tài liệu chính thức ghi rõ: với Angular v21+, bạn không cần làm gì để bật Zoneless, nhưng nên kiểm tra để đảm bảo app không dùng `provideZoneChangeDetection()` để override lại cấu hình mặc định. ([Angular][1])

### Tư duy cũ: Zone.js-driven change detection

Trước đây, Angular dựa vào Zone.js để monkey-patch nhiều browser APIs như click, timer, promise, HTTP, v.v. Khi một async task hoàn thành, Zone.js báo cho Angular chạy change detection.

```ts
setTimeout(() => {
  this.count++;
  // Zone.js phát hiện async task hoàn thành,
  // sau đó Angular chạy change detection.
});
```

### Tư duy v21: explicit notification model

Trong Zoneless Angular, Angular cần các “notification sources” rõ ràng để biết khi nào cần update UI. Các nguồn notification chính gồm: `ChangeDetectorRef.markForCheck`, `AsyncPipe`, `ComponentRef.setInput`, cập nhật một signal được đọc trong template, callback từ template/host listener, hoặc attach một view đã được đánh dấu dirty. ([Angular][1])

```ts
count = signal(0);

increment(): void {
  this.count.update(value => value + 1);
  // Signal update là notification rõ ràng cho Angular.
}
```

### Production implication

Trong v21, code Angular hiện đại nên ưu tiên:

| Practice                             | Lý do                                                     |
| ------------------------------------ | --------------------------------------------------------- |
| Signals cho local state              | Tạo notification rõ ràng cho UI                           |
| `input()`, `model()`, `output()`     | Signal-first component API                                |
| `AsyncPipe` khi dùng Observable      | `AsyncPipe` tự gọi `markForCheck`                         |
| `OnPush` hoặc OnPush-compatible code | Tài liệu khuyến nghị như bước tốt để tương thích Zoneless |
| Tránh mutation im lặng               | Angular không còn Zone.js để “đoán” mọi async update      |

`OnPush` không bắt buộc tuyệt đối, nhưng Angular docs nói đây là bước được khuyến nghị để đảm bảo component dùng các notification mechanism đúng trong app Zoneless. ([Angular][1])

---

## 2. Signals trong Angular v21: nền tảng reactive chính

Angular Signals là hệ thống giúp Angular theo dõi chi tiết nơi state được đọc và nơi cần update rendering. Signal được đọc bằng cách gọi function getter, ví dụ `count()`, và writable signal có thể update bằng `.set()` hoặc `.update()`. ([Angular][2])

```ts
const count = signal(0);

count.set(3);
count.update(value => value + 1);

console.log(count());
```

### Mental model

| API              | Vai trò                                   |
| ---------------- | ----------------------------------------- |
| `signal()`       | Writable state                            |
| `computed()`     | Derived state, lazy + memoized            |
| `linkedSignal()` | State vừa derived vừa có thể set thủ công |
| `resource()`     | Async state từ Promise/fetch              |
| `rxResource()`   | Async state từ RxJS Observable            |
| `effect()`       | Side effect, dùng cuối cùng               |

Angular docs nhấn mạnh nên ưu tiên `computed()` cho derived value và `linkedSignal()` cho value vừa phụ thuộc source vừa có thể set thủ công; `effect()` nên là API cuối cùng bạn dùng cho side effect. ([Angular][3])

---

## 3. `linkedSignal()`: state synchronization có kiểm soát

`linkedSignal()` dùng cho loại state có **default value phụ thuộc vào state khác**, nhưng vẫn cần cho phép user thay đổi thủ công.

### Vấn đề thường gặp

Ví dụ bạn có danh sách shipping options và selected option:

```ts
shippingOptions = signal(['Ground', 'Air', 'Sea']);
selectedOption = signal(this.shippingOptions()[0]);
```

Nếu `shippingOptions` thay đổi, `selectedOption` có thể trỏ tới một option không còn hợp lệ.

### Giải pháp v21: `linkedSignal()`

```ts
shippingOptions = signal(['Ground', 'Air', 'Sea']);

selectedOption = linkedSignal(() => this.shippingOptions()[0]);

changeShipping(index: number): void {
  this.selectedOption.set(this.shippingOptions()[index]);
}
```

`linkedSignal()` giống `signal()` ở chỗ bạn vẫn có thể `.set()` và `.update()`, nhưng thay vì truyền default value, bạn truyền một computation function giống `computed()`. Khi computation thay đổi, linked signal sẽ sync lại theo kết quả mới. ([Angular][4])

---

## 4. `linkedSignal()` với `source` và `previous`

Trong app thật, bạn thường không muốn reset selection về item đầu tiên mỗi lần list thay đổi. Bạn muốn giữ lựa chọn cũ nếu nó vẫn còn tồn tại.

```ts
selectedOption = linkedSignal<ShippingMethod[], ShippingMethod>({
  source: this.shippingOptions,
  computation: (newOptions, previous) => {
    return (
      newOptions.find(option => option.id === previous?.value.id) ??
      newOptions[0]
    );
  },
});
```

Khi dùng object form, `source` có thể là bất kỳ signal nào, kể cả `computed()` hoặc component `input()`. `computation` nhận giá trị source mới và object `previous`, trong đó `previous.value` là giá trị trước đó của linked signal. Angular docs cũng lưu ý rằng khi dùng `previous`, bạn cần khai báo generic type rõ ràng cho `linkedSignal`. ([Angular][4])

### Khi nào dùng `linkedSignal()`?

Dùng khi state có 2 đặc điểm:

1. Có default value phụ thuộc vào source khác.
2. User hoặc component vẫn có quyền thay đổi state đó.

Ví dụ tốt:

| Use case                            | Vì sao hợp                                               |
| ----------------------------------- | -------------------------------------------------------- |
| Selected item trong list async      | List đổi thì selection cần được validate lại             |
| Selected tab phụ thuộc route/config | Config đổi thì tab cũ có thể không còn hợp lệ            |
| Selected filter option              | Filter options đổi nhưng nên giữ lựa chọn nếu còn hợp lệ |
| Draft value phụ thuộc input         | Input đổi thì draft cần reset/sync có điều kiện          |

Không nên dùng `effect()` để copy state từ signal A sang signal B nếu bài toán là derived/manual state. Angular docs khuyến nghị dùng `computed()` hoặc `linkedSignal()` thay vì propagation bằng effect. ([Angular][3])

---

## 5. Resource API: `resource()` cho async data fetching

`resource()` là API để đưa async data vào signal-based code. Tài liệu chính thức hiện đánh dấu `resource` là **experimental**: có thể dùng thử, nhưng API có thể thay đổi trước khi stable. ([Angular][5])

### Core idea

Signal APIs như `signal()`, `computed()`, `input()` là synchronous, nhưng app thật cần async data. `resource()` giải quyết bài toán này bằng cách expose async state dưới dạng signals: `value`, `hasValue`, `isLoading`, `error`, `status`. ([Angular][5])

```ts
userResource = resource({
  params: () => ({ id: this.userId() }),

  loader: ({ params, abortSignal }) => {
    return fetch(`/api/users/${params.id}`, {
      signal: abortSignal,
    }).then(response => response.json());
  },
});
```

### `params`

`params` là reactive computation. Bất kỳ signal nào được đọc trong `params` thay đổi thì resource tạo params mới và gọi lại loader. ([Angular][5])

```ts
params: () => ({
  id: this.userId(),
  locale: this.locale(),
})
```

Nếu `params` trả về `undefined`, loader không chạy và status trở thành `'idle'`. ([Angular][5])

```ts
params: () => {
  const id = this.userId();
  return id ? { id } : undefined;
}
```

### `loader`

`loader` là async function. Nó nhận `params`, `previous`, và `abortSignal`. Nếu params thay đổi trong khi request đang chạy, resource sẽ abort loading operation hiện tại. ([Angular][5])

```ts
loader: async ({ params, abortSignal }) => {
  const response = await fetch(`/api/users/${params.id}`, {
    signal: abortSignal,
  });

  if (!response.ok) {
    throw new Error('Failed to load user');
  }

  return response.json() as Promise<User>;
}
```

### Resource status

Resource expose nhiều signal trạng thái:

| Signal        | Ý nghĩa                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `value()`     | Giá trị mới nhất hoặc `undefined`                                        |
| `hasValue()`  | Có value hợp lệ hay chưa                                                 |
| `error()`     | Error gần nhất                                                           |
| `isLoading()` | Loader có đang chạy không                                                |
| `status()`    | `'idle'`, `'loading'`, `'reloading'`, `'resolved'`, `'error'`, `'local'` |

Docs cũng nói `reload()` có thể trigger loader thủ công. ([Angular][5])

---

## 6. `rxResource()`: Resource API cho RxJS Observable

`rxResource()` nằm trong `@angular/core/rxjs-interop` và hiện cũng được đánh dấu **experimental** trong API reference. Nó giống `resource()`, nhưng thay vì `loader` trả về Promise, nó dùng `stream` trả về RxJS `Observable`. ([Angular][6])

```ts
usersResource = rxResource({
  params: () => ({ query: this.query() }),

  stream: ({ params }) => {
    return this.userApi.searchUsers(params.query);
  },
});
```

Theo docs RxJS interop, `stream` nhận factory function trả về Observable; factory này nhận params hiện tại và được gọi lại mỗi khi params computation tạo giá trị mới. Ngoài điểm đó, `rxResource()` cung cấp cùng kiểu API như `resource()` để đọc value, loading state và error. ([Angular][7])

### Khi dùng `resource()` vs `rxResource()`

| API              | Nên dùng khi                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| `resource()`     | Bạn dùng `fetch`, Promise, async/await                                        |
| `rxResource()`   | Service hiện có trả về Observable                                             |
| `httpResource()` | Muốn dùng Angular `HttpClient` stack + interceptors với signal-style resource |

`httpResource()` là wrapper reactive quanh `HttpClient`, expose response và request status dưới dạng signals, nhưng docs hiện cũng đánh dấu API này là experimental. ([Angular][8])

---

## 7. `@let`: local template variable syntax

`@let` cho phép khai báo biến local trong template và tái sử dụng trong cùng template. Angular tự động giữ giá trị của biến này up-to-date theo expression, tương tự binding. ([Angular][9])

```html
@let name = user.name;
@let greeting = 'Hello, ' + name;

<h1>{{ greeting }}</h1>
```

### Quy tắc quan trọng

Mỗi `@let` chỉ khai báo **một biến**. Không được khai báo nhiều biến bằng dấu phẩy. ([Angular][9])

```html
<!-- Valid -->
@let user = userResource.value();

<!-- Invalid -->
@let firstName = user.firstName, lastName = user.lastName;
```

`@let` không thể reassign sau khi khai báo. Nó khác JavaScript `let` ở điểm này. ([Angular][9])

```html
@let value = 1;

<!-- Invalid -->
<button (click)="value = value + 1">Increment</button>
```

### Scope của `@let`

`@let` scoped theo current view và descendant views. Nó không được hoist ra ngoài block như `@if`, `@for`, `@defer`. ([Angular][9])

```html
@if (userResource.hasValue()) {
  @let user = userResource.value();

  <h2>{{ user.name }}</h2>
}

<!-- user không accessible ở đây -->
```

---

# Part 2: Code Syntax — Angular 21 Standard

Ví dụ dưới đây mô phỏng một component hiện đại theo style Angular v21:

* `model()` cho two-way binding giữa parent và child.
* `resource()` để fetch users theo query.
* `linkedSignal()` để giữ selected user hợp lệ khi list thay đổi.
* `@let` để template gọn và dễ scan.
* Zoneless-friendly vì state update qua signals.

---

## 1. Types

```ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## 2. Modern child component: `UserSearchPickerComponent`

```ts
import {
  Component,
  computed,
  linkedSignal,
  model,
  resource,
} from '@angular/core';

interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-search-picker',
  standalone: true,
  templateUrl: './user-search-picker.html',
})
export class UserSearchPickerComponent {
  // Exposed as [(query)] to the parent.
  query = model('');

  usersResource = resource<User[], { query: string }>({
    params: () => {
      const query = this.query().trim();

      return query.length >= 2 ? { query } : undefined;
    },

    loader: async ({ params, abortSignal }) => {
      const response = await fetch(
        `/api/users?query=${encodeURIComponent(params.query)}`,
        { signal: abortSignal },
      );

      if (!response.ok) {
        throw new Error('Could not load users');
      }

      return (await response.json()) as User[];
    },
  });

  users = computed(() => {
    return this.usersResource.hasValue()
      ? this.usersResource.value()
      : [];
  });

  selectedUser = linkedSignal<User[], User | null>({
    source: this.users,
    computation: (users, previous) => {
      return (
        users.find(user => user.id === previous?.value?.id) ??
        users[0] ??
        null
      );
    },
  });

  selectUser(user: User): void {
    this.selectedUser.set(user);
  }

  reload(): void {
    this.usersResource.reload();
  }
}
```

### Điểm đáng chú ý

```ts
query = model('');
```

`model()` tạo một model input có thể nhận binding từ parent và cũng có thể emit change ngược lại. Khi khai báo model input, Angular tự tạo output tương ứng bằng cách thêm hậu tố `Change`, ví dụ `queryChange`. ([Angular][10])

```ts
params: () => {
  const query = this.query().trim();
  return query.length >= 2 ? { query } : undefined;
}
```

Nếu query quá ngắn, `params` trả về `undefined`, loader không chạy và resource ở trạng thái idle. ([Angular][5])

```ts
selectedUser = linkedSignal<User[], User | null>({
  source: this.users,
  computation: ...
});
```

Selection sẽ tự sync lại khi list users thay đổi, nhưng vẫn cho phép user chọn thủ công bằng `.set()`. Đây là use case điển hình của `linkedSignal()`. ([Angular][4])

---

## 3. Template với `@let`

```html
<section class="user-picker">
  <label for="user-search">Search user</label>

  <input
    id="user-search"
    type="search"
    [value]="query()"
    (input)="query.set($any($event.target).value)"
    placeholder="Type at least 2 characters"
  />

  @let isLoading = usersResource.isLoading();
  @let error = usersResource.error();
  @let users = this.users();
  @let selected = selectedUser();

  @if (isLoading) {
    <p>Loading users...</p>
  } @else if (error) {
    <p role="alert">Could not load users.</p>
    <button type="button" (click)="reload()">Try again</button>
  } @else if (users.length === 0) {
    <p>No users found.</p>
  } @else {
    <ul>
      @for (user of users; track user.id) {
        <li>
          <button
            type="button"
            [class.is-selected]="selected?.id === user.id"
            (click)="selectUser(user)"
          >
            <strong>{{ user.name }}</strong>
            <span>{{ user.email }}</span>
          </button>
        </li>
      }
    </ul>

    @if (selected) {
      <aside>
        <h3>Selected user</h3>
        <p>{{ selected.name }}</p>
        <p>{{ selected.email }}</p>
      </aside>
    }
  }
</section>
```

### Vì sao template này là style v21?

| Syntax                      | Lý do                                               |
| --------------------------- | --------------------------------------------------- |
| `@let`                      | Giảm lặp expression như `usersResource.isLoading()` |
| `@if`                       | Control flow rõ ràng, không cần `*ngIf`             |
| `@for (...; track user.id)` | Stable identity bắt buộc                            |
| `query()`                   | Đọc signal/model input                              |
| `selectedUser()`            | Đọc linked signal                                   |
| `(input)="query.set(...)"`  | Explicit signal update, Zoneless-friendly           |

---

## 4. Parent component dùng two-way binding với `model()`

```ts
import { Component, signal } from '@angular/core';
import { UserSearchPickerComponent } from './user-search-picker.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [UserSearchPickerComponent],
  template: `
    <app-user-search-picker [(query)]="searchQuery" />

    <p>Current search: {{ searchQuery() }}</p>
  `,
})
export class AdminPageComponent {
  searchQuery = signal('');
}
```

Điểm quan trọng: khi binding model input với signal, parent truyền **signal instance**, không truyền `searchQuery()`. Tài liệu chính thức cũng nhấn mạnh điều này trong ví dụ model input/two-way binding. ([Angular][10])

```html
<!-- Correct -->
<app-user-search-picker [(query)]="searchQuery" />

<!-- Incorrect -->
<app-user-search-picker [(query)]="searchQuery()" />
```

---

## 5. Phiên bản `rxResource()` nếu service trả về Observable

```ts
import { Component, computed, inject, linkedSignal, model } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserApi } from './user-api.service';

@Component({
  selector: 'app-user-search-picker-rx',
  standalone: true,
  templateUrl: './user-search-picker.html',
})
export class UserSearchPickerRxComponent {
  private readonly userApi = inject(UserApi);

  query = model('');

  usersResource = rxResource({
    params: () => {
      const query = this.query().trim();

      return query.length >= 2 ? { query } : undefined;
    },

    stream: ({ params }) => {
      return this.userApi.searchUsers(params.query);
    },
  });

  users = computed(() => {
    return this.usersResource.hasValue()
      ? this.usersResource.value()
      : [];
  });

  selectedUser = linkedSignal({
    source: this.users,
    computation: (users, previous) => {
      return (
        users.find(user => user.id === previous?.value?.id) ??
        users[0] ??
        null
      );
    },
  });
}
```

`rxResource()` dùng `stream`, không dùng `loader`. `stream` phải trả về RxJS `Observable`. ([Angular][7])

---

# Part 3: Comparative Analysis Table — Angular 17 vs Angular 21

| Feature/Use Case                | Angular 17/Traditional Syntax                                            | Angular 21 Syntax                                                            | Performance & DX Gain                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Change detection model          | Zone.js thường vẫn là default trong app mới                              | Zoneless là default trong Angular v21+                                       | Giảm dependency vào monkey-patching, bundle nhỏ hơn, debugging dễ hơn, async/await native hơn. ([Angular][1])   |
| State primitive                 | Class property, RxJS, hoặc `signal()` mới được giới thiệu                | Signal-first architecture: `signal`, `computed`, `linkedSignal`, `resource`  | Fine-grained reactivity, Angular biết rõ nơi state được đọc để tối ưu render. ([Angular][2])                    |
| Derived state                   | Getter hoặc `computed()` cơ bản                                          | `computed()` cho derived readonly state                                      | Lazy + memoized, tránh tính toán lại không cần thiết. ([Angular][2])                                            |
| State vừa derived vừa writable  | Thường dùng `effect()` để sync signal A sang signal B                    | `linkedSignal()`                                                             | Tránh propagation bằng effect, giữ state hợp lệ khi source đổi nhưng vẫn cho phép user override. ([Angular][4]) |
| Async data fetching             | `HttpClient.get().subscribe()`, `async` pipe, manual loading/error state | `resource()` với `params`, `loader`, `value`, `isLoading`, `error`, `status` | Gom async value + loading + error vào một reactive object; tự reload khi params signal đổi. ([Angular][5])      |
| Observable-based async resource | Manual Observable subscription hoặc `AsyncPipe`                          | `rxResource({ params, stream })`                                             | Giữ Observable service hiện có nhưng expose state theo Resource API. ([Angular][7])                             |
| HTTP resource                   | `HttpClient` + `Observable` + `AsyncPipe`                                | `httpResource()`                                                             | Wrapper quanh `HttpClient`, có interceptors, status/value là signals; hiện vẫn experimental. ([Angular][8])     |
| Component input                 | `@Input()` hoặc `input()`                                                | `input()` signal-based input                                                 | Input được đọc như signal, dễ dùng với `computed()` và `linkedSignal()`. ([Angular][10])                        |
| Two-way component binding       | `@Input()` + `@Output() valueChange`                                     | `model()`                                                                    | Tự tạo input/output pair; update bằng `.set()`/`.update()`, hỗ trợ `[(value)]`. ([Angular][10])                 |
| Template variable               | `*ngIf="obs$ \| async as value"` hoặc template reference variable        | `@let value = expression;`                                                   | Tái sử dụng expression rõ ràng, không phụ thuộc `ngIf as`, tự update theo binding. ([Angular][9])               |
| Template branching              | `*ngIf`, `ng-template`, `else`                                           | `@if`, `@else if`, `@else`                                                   | Syntax gần JavaScript, dễ scan, ít template boilerplate.                                                        |
| List rendering                  | `*ngFor` + optional `trackBy`                                            | `@for (item of items; track item.id)`                                        | Stable identity rõ ràng; code review dễ phát hiện list thiếu tracking.                                          |
| Empty list UI                   | `*ngIf` kết hợp `*ngFor`                                                 | `@for (...) { ... } @empty { ... }`                                          | Empty state nằm cùng list logic, template gọn hơn.                                                              |
| Switch rendering                | `[ngSwitch]`, `*ngSwitchCase`, `*ngSwitchDefault`                        | `@switch`, `@case`, `@default`                                               | Cấu trúc rõ như JavaScript switch, dễ đọc với union state.                                                      |
| Lazy template block             | `loadChildren`, dynamic import, hoặc manual lazy UI                      | `@defer`                                                                     | Lazy-load template block trực tiếp, giảm initial JS cho phần UI không critical.                                 |
| Effect usage                    | Dễ lạm dụng effect để sync state                                         | Effect chỉ cho side effect với non-reactive APIs                             | Giảm bug vòng lặp, giảm unnecessary change detection, architecture rõ hơn. ([Angular][3])                       |
| Production architecture         | Component + RxJS-heavy services                                          | Standalone + Zoneless + Signals + Resources                                  | Ít boilerplate hơn, rõ source-of-truth hơn, template và state đồng bộ hơn.                                      |

---

# Senior-level Architecture Recommendation cho Angular v21

## 1. State hierarchy

```txt
Server data
→ resource() / rxResource() / httpResource()

Local writable UI state
→ signal() / model()

Derived readonly state
→ computed()

Derived but user-overridable state
→ linkedSignal()

Imperative side effects
→ effect()
```

---

## 2. Rule of thumb

| Bài toán                                      | API nên dùng     |
| --------------------------------------------- | ---------------- |
| Local counter, toggle, selected ID            | `signal()`       |
| Derived label, filtered list, total price     | `computed()`     |
| Selected item phụ thuộc async list            | `linkedSignal()` |
| Child component cần two-way binding           | `model()`        |
| Fetch bằng `fetch`/Promise                    | `resource()`     |
| Fetch bằng Observable service                 | `rxResource()`   |
| Fetch qua Angular `HttpClient` + interceptors | `httpResource()` |
| Sync localStorage, canvas, chart library      | `effect()`       |

---

## 3. Anti-pattern cần tránh trong v21

### Không dùng `effect()` để copy state

```ts
// Avoid
effect(() => {
  this.selectedUser.set(this.users()[0]);
});
```

Dùng `linkedSignal()`:

```ts
selectedUser = linkedSignal({
  source: this.users,
  computation: users => users[0] ?? null,
});
```

---

### Không mutate object/array im lặng

```ts
// Avoid
this.users().push(newUser);
```

Dùng update:

```ts
this.users.update(users => [...users, newUser]);
```

---

### Không đọc `resource.value()` khi chưa guard

```ts
// Risky
const user = this.userResource.value();
```

Dùng `hasValue()`:

```ts
const user = this.userResource.hasValue()
  ? this.userResource.value()
  : null;
```

Docs nói `hasValue()` vừa là type guard loại `undefined`, vừa giúp tránh đọc `value()` trong error state. ([Angular][5])

---

# Key Takeaways

Angular v21 là bước chuyển lớn từ **Zone.js-driven Angular** sang **Signal-first, Zoneless Angular**.

Điểm quan trọng nhất cần master:

1. **Zoneless là default trong v21+**
   App mới không cần `zone.js`; UI nên update qua signals, event listeners, `AsyncPipe`, `markForCheck`, hoặc input updates rõ ràng.

2. **`linkedSignal()` thay thế nhiều pattern dùng `effect()` sai mục đích**
   Dùng cho state vừa phụ thuộc source khác vừa có thể được user set thủ công.

3. **`resource()` và `rxResource()` là async reactivity layer mới**
   `resource()` cho Promise/fetch; `rxResource()` cho Observable service. Cả hai hiện vẫn experimental theo docs.

4. **`model()` là chuẩn hiện đại cho custom two-way binding**
   Rất phù hợp cho custom form controls, picker, slider, combobox.

5. **`@let` giúp template sạch hơn**
   Dùng để đặt tên cho expression phức tạp, resource state, selected value, computed result trong template.

Một Angular v21 codebase tốt nên đi theo hướng:

```txt
Standalone components
+ Zoneless by default
+ Signals for state
+ computed() for derived readonly state
+ linkedSignal() for synchronized writable state
+ resource()/rxResource() for async state
+ model() for component two-way binding
+ @let / @if / @for / @switch for clean templates
```

[1]: https://angular.dev/guide/zoneless "Zoneless • Angular"
[2]: https://angular.dev/guide/signals "Signals • Overview • Angular"
[3]: https://angular.dev/guide/signals/effect "Side effects for non-reactives APIs • Angular"
[4]: https://angular.dev/guide/signals/linked-signal "Dependent state with linkedSignal • Angular"
[5]: https://angular.dev/guide/signals/resource "Async reactivity with resources • Angular"
[6]: https://angular.dev/api/core/rxjs-interop/rxResource "rxResource • Angular"
[7]: https://angular.dev/ecosystem/rxjs-interop?utm_source=chatgpt.com "RxJS interop with Angular signals"
[8]: https://angular.dev/guide/http/http-resource "Reactive data fetching with httpResource • Angular"
[9]: https://angular.dev/guide/templates/variables "Variables in templates • Angular"
[10]: https://angular.dev/guide/components/inputs?utm_source=chatgpt.com "Accepting data with input properties"

---
English version
# Angular 21 Cheat Sheet — Principal Developer Edition

## Part 1: Deep-Dive into Advanced Reactivity & Core Shifts

## 1. Zoneless Angular in v21

In Angular 21+, **Zoneless Angular is the default for new applications**. That means Angular no longer relies on `zone.js` to automatically detect every asynchronous browser event.

In older Angular apps, Zone.js patched browser APIs such as:

```ts
setTimeout()
Promise
click events
XHR / HTTP requests
```

When one of those async operations finished, Zone.js notified Angular to run change detection.

In Angular 21, the model is more explicit.

Angular updates the UI through clear notification sources such as:

| Notification source                | Example                       |
| ---------------------------------- | ----------------------------- |
| Signal updates                     | `count.set(1)`                |
| Template event listeners           | `(click)="save()"`            |
| `AsyncPipe`                        | `users$ \| async`             |
| `ChangeDetectorRef.markForCheck()` | Manual dirty marking          |
| Component input updates            | Parent passes new input value |
| View attachment                    | Attaching a dirty view        |

### Old mental model

```ts
setTimeout(() => {
  this.count++;
  // Zone.js notices the async task
  // and Angular runs change detection.
});
```

### Angular 21 mental model

```ts
count = signal(0);

increment(): void {
  this.count.update(value => value + 1);
  // Signal update explicitly notifies Angular.
}
```

### Production impact

For Angular 21 applications, the recommended architecture is:

```txt
Signals for local state
+ input(), output(), model() for component APIs
+ AsyncPipe for Observables
+ OnPush-compatible components
+ No silent mutations
```

`OnPush` is not always mandatory, but writing OnPush-compatible components is the safest way to make an application work well in a Zoneless environment.

---

## 2. Signals as the core reactivity model

Signals are now the foundation of modern Angular reactivity.

A signal is a reactive value. You read it by calling it as a function:

```ts
count()
```

You update writable signals with:

```ts
count.set(10);
count.update(value => value + 1);
```

Example:

```ts
import { signal } from '@angular/core';

const count = signal(0);

count.set(3);
count.update(value => value + 1);

console.log(count());
```

### Signal APIs you should know

| API              | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `signal()`       | Writable local state                            |
| `computed()`     | Read-only derived state                         |
| `linkedSignal()` | Derived state that can also be manually changed |
| `resource()`     | Async state from Promise/fetch                  |
| `rxResource()`   | Async state from RxJS Observable                |
| `effect()`       | Side effects                                    |

### Senior-level rule

Use APIs in this order:

```txt
signal()
→ computed()
→ linkedSignal()
→ resource() / rxResource()
→ effect()
```

Use `effect()` only when you truly need a side effect, such as logging, syncing with `localStorage`, integrating with a chart library, or updating a non-Angular API.

---

## 3. `linkedSignal()`: synchronized writable state

`linkedSignal()` is used when a piece of state should be connected to another signal, but still remain writable.

This is useful when state has a default value based on another source, but users can still override it.

### Common problem

```ts
shippingOptions = signal(['Ground', 'Air', 'Sea']);

selectedOption = signal(this.shippingOptions()[0]);
```

This works at first, but if `shippingOptions` changes later, `selectedOption` may become invalid.

### Angular 21 solution

```ts
import { linkedSignal, signal } from '@angular/core';

shippingOptions = signal(['Ground', 'Air', 'Sea']);

selectedOption = linkedSignal(() => this.shippingOptions()[0]);

changeShipping(index: number): void {
  this.selectedOption.set(this.shippingOptions()[index]);
}
```

### Why this is useful

`linkedSignal()` behaves like both:

| Similar to   | Because                                              |
| ------------ | ---------------------------------------------------- |
| `computed()` | It derives its value from another signal             |
| `signal()`   | It can still be changed with `.set()` or `.update()` |

---

## 4. `linkedSignal()` with `source` and `previous`

In real applications, you often do not want to reset selection every time the source list changes.

Instead, you usually want to keep the previous selected item if it still exists.

```ts
import { linkedSignal, signal } from '@angular/core';

interface ShippingMethod {
  id: string;
  name: string;
}

shippingOptions = signal<ShippingMethod[]>([
  { id: 'ground', name: 'Ground' },
  { id: 'air', name: 'Air' },
]);

selectedOption = linkedSignal<ShippingMethod[], ShippingMethod | null>({
  source: this.shippingOptions,
  computation: (options, previous) => {
    return (
      options.find(option => option.id === previous?.value?.id) ??
      options[0] ??
      null
    );
  },
});
```

### What happens here?

| Step                                      | Behavior                      |
| ----------------------------------------- | ----------------------------- |
| `shippingOptions` changes                 | `linkedSignal()` recalculates |
| Previous selected option still exists     | Keep it                       |
| Previous selected option no longer exists | Select the first option       |
| List is empty                             | Return `null`                 |

### When to use `linkedSignal()`

Use it for:

| Use case                              | Example                                           |
| ------------------------------------- | ------------------------------------------------- |
| Selected item from async list         | Selected user in search results                   |
| Selected tab from dynamic config      | Tabs generated from permissions                   |
| Selected filter from changing options | Product filter dropdown                           |
| Draft state from input                | Editable form field initialized from parent input |

Avoid using `effect()` to copy one signal into another when `linkedSignal()` expresses the relationship more directly.

---

## 5. Resource API: `resource()` for async data

`resource()` is Angular’s signal-based API for async data loading.

It helps you model:

```txt
value
loading state
error state
status
reload behavior
cancellation
```

in one reactive object.

> Important: As of the current Angular docs, Resource APIs are still marked experimental, so the API can still change before becoming fully stable.

### Basic example

```ts
import { resource, signal } from '@angular/core';

interface User {
  id: string;
  name: string;
  email: string;
}

userId = signal('1');

userResource = resource<User, { id: string }>({
  params: () => ({ id: this.userId() }),

  loader: async ({ params, abortSignal }) => {
    const response = await fetch(`/api/users/${params.id}`, {
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new Error('Could not load user');
    }

    return (await response.json()) as User;
  },
});
```

### `params`

`params` is a reactive computation.

Whenever a signal used inside `params` changes, Angular creates new params and calls the loader again.

```ts
params: () => ({
  id: this.userId(),
  locale: this.locale(),
})
```

If `params` returns `undefined`, the loader does not run.

```ts
params: () => {
  const id = this.userId();

  return id ? { id } : undefined;
}
```

This is useful for search fields, optional route params, or conditional fetching.

---

### `loader`

The `loader` is an async function.

It receives:

| Loader argument | Purpose                                    |
| --------------- | ------------------------------------------ |
| `params`        | Current params returned by `params()`      |
| `abortSignal`   | Used to cancel in-flight requests          |
| `previous`      | Previous resource status/value information |

Example with cancellation:

```ts
loader: async ({ params, abortSignal }) => {
  const response = await fetch(`/api/users/${params.id}`, {
    signal: abortSignal,
  });

  return (await response.json()) as User;
}
```

If params change while a request is still running, Angular can abort the old request.

---

## 6. Resource state

A resource exposes state through signals.

```ts
userResource.value()
userResource.hasValue()
userResource.isLoading()
userResource.error()
userResource.status()
```

### Common states

| API           | Meaning                                          |
| ------------- | ------------------------------------------------ |
| `value()`     | Latest resolved value, or `undefined`            |
| `hasValue()`  | Whether the resource currently has a valid value |
| `isLoading()` | Whether a loader is running                      |
| `error()`     | Latest error                                     |
| `status()`    | Current resource status                          |
| `reload()`    | Manually reload the resource                     |

Example:

```ts
reload(): void {
  this.userResource.reload();
}
```

### Safe value access

Avoid this:

```ts
const user = this.userResource.value();
```

Prefer this:

```ts
const user = this.userResource.hasValue()
  ? this.userResource.value()
  : null;
```

`hasValue()` protects you from reading a missing or invalid value.

---

## 7. `rxResource()` for Observable-based async data

Use `rxResource()` when your existing service returns an RxJS `Observable`.

```ts
import { rxResource } from '@angular/core/rxjs-interop';

usersResource = rxResource({
  params: () => ({ query: this.query() }),

  stream: ({ params }) => {
    return this.userApi.searchUsers(params.query);
  },
});
```

### Difference between `resource()` and `rxResource()`

| API            | Async source                    |
| -------------- | ------------------------------- |
| `resource()`   | Promise, `fetch`, `async/await` |
| `rxResource()` | RxJS `Observable`               |

With `rxResource()`, you provide a `stream` function instead of a `loader`.

```ts
stream: ({ params }) => {
  return this.userApi.searchUsers(params.query);
}
```

This is especially useful when your application already has services based on `HttpClient`, because `HttpClient` returns Observables.

---

## 8. `@let`: template variables

`@let` lets you create local variables directly in Angular templates.

It helps avoid repeating long expressions.

### Basic example

```html
@let name = user.name;
@let greeting = 'Hello, ' + name;

<h1>{{ greeting }}</h1>
```

### With resource state

```html
@let isLoading = userResource.isLoading();
@let user = userResource.value();
@let error = userResource.error();
```

### Rules

| Rule                       | Example                                          |
| -------------------------- | ------------------------------------------------ |
| One variable per `@let`    | `@let user = userResource.value();`              |
| No multiple declarations   | `@let a = 1, b = 2;` is invalid                  |
| Cannot be reassigned       | You cannot do `value = value + 1`                |
| Scoped to the current view | Variables inside `@if` are not available outside |

Example scope:

```html
@if (userResource.hasValue()) {
  @let user = userResource.value();

  <h2>{{ user.name }}</h2>
}

<!-- user is not available here -->
```

---

# Part 2: Code Syntax — Angular 21 Standard

The following example shows a modern Angular 21 component using:

```txt
model()
+ linkedSignal()
+ resource()
+ @let
+ @if
+ @for
+ signal-based state
```

---

## 1. Types

```ts
export interface User {
  id: string;
  name: string;
  email: string;
}
```

---

## 2. Modern component with `model()`, `resource()`, and `linkedSignal()`

```ts
import {
  Component,
  computed,
  linkedSignal,
  model,
  resource,
} from '@angular/core';

interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-search-picker',
  standalone: true,
  templateUrl: './user-search-picker.html',
})
export class UserSearchPickerComponent {
  // Exposed to the parent as [(query)].
  query = model('');

  usersResource = resource<User[], { query: string }>({
    params: () => {
      const query = this.query().trim();

      return query.length >= 2 ? { query } : undefined;
    },

    loader: async ({ params, abortSignal }) => {
      const response = await fetch(
        `/api/users?query=${encodeURIComponent(params.query)}`,
        { signal: abortSignal },
      );

      if (!response.ok) {
        throw new Error('Could not load users');
      }

      return (await response.json()) as User[];
    },
  });

  users = computed(() => {
    return this.usersResource.hasValue()
      ? this.usersResource.value()
      : [];
  });

  selectedUser = linkedSignal<User[], User | null>({
    source: this.users,
    computation: (users, previous) => {
      return (
        users.find(user => user.id === previous?.value?.id) ??
        users[0] ??
        null
      );
    },
  });

  selectUser(user: User): void {
    this.selectedUser.set(user);
  }

  reload(): void {
    this.usersResource.reload();
  }
}
```

---

## 3. Template with `@let`, `@if`, and `@for`

```html
<section class="user-picker">
  <label for="user-search">Search user</label>

  <input
    id="user-search"
    type="search"
    [value]="query()"
    (input)="query.set($any($event.target).value)"
    placeholder="Type at least 2 characters"
  />

  @let isLoading = usersResource.isLoading();
  @let error = usersResource.error();
  @let users = this.users();
  @let selected = selectedUser();

  @if (isLoading) {
    <p>Loading users...</p>
  } @else if (error) {
    <p role="alert">Could not load users.</p>

    <button type="button" (click)="reload()">
      Try again
    </button>
  } @else if (users.length === 0) {
    <p>No users found.</p>
  } @else {
    <ul>
      @for (user of users; track user.id) {
        <li>
          <button
            type="button"
            [class.is-selected]="selected?.id === user.id"
            (click)="selectUser(user)"
          >
            <strong>{{ user.name }}</strong>
            <span>{{ user.email }}</span>
          </button>
        </li>
      }
    </ul>

    @if (selected) {
      <aside>
        <h3>Selected user</h3>
        <p>{{ selected.name }}</p>
        <p>{{ selected.email }}</p>
      </aside>
    }
  }
</section>
```

---

## 4. Parent component using two-way binding with `model()`

```ts
import { Component, signal } from '@angular/core';
import { UserSearchPickerComponent } from './user-search-picker.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [UserSearchPickerComponent],
  template: `
    <app-user-search-picker [(query)]="searchQuery" />

    <p>Current search: {{ searchQuery() }}</p>
  `,
})
export class AdminPageComponent {
  searchQuery = signal('');
}
```

### Important syntax detail

When binding a parent signal to a child `model()`, pass the signal itself:

```html
<app-user-search-picker [(query)]="searchQuery" />
```

Do not call the signal:

```html
<!-- Incorrect -->
<app-user-search-picker [(query)]="searchQuery()" />
```

---

## 5. Same pattern with `rxResource()`

Use this version when your data service returns an Observable.

```ts
import {
  Component,
  computed,
  inject,
  linkedSignal,
  model,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserApi } from './user-api.service';

interface User {
  id: string;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-search-picker-rx',
  standalone: true,
  templateUrl: './user-search-picker.html',
})
export class UserSearchPickerRxComponent {
  private readonly userApi = inject(UserApi);

  query = model('');

  usersResource = rxResource({
    params: () => {
      const query = this.query().trim();

      return query.length >= 2 ? { query } : undefined;
    },

    stream: ({ params }) => {
      return this.userApi.searchUsers(params.query);
    },
  });

  users = computed(() => {
    return this.usersResource.hasValue()
      ? this.usersResource.value()
      : [];
  });

  selectedUser = linkedSignal<User[], User | null>({
    source: this.users,
    computation: (users, previous) => {
      return (
        users.find(user => user.id === previous?.value?.id) ??
        users[0] ??
        null
      );
    },
  });

  selectUser(user: User): void {
    this.selectedUser.set(user);
  }
}
```

---

# Part 3: Comparative Analysis Table — Angular 17 vs Angular 21

| Feature / Use Case            | Angular 17 / Traditional Syntax                         | Angular 21 Syntax                                        | Performance & DX Gain                                                  |
| ----------------------------- | ------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Change detection model        | Zone.js-based change detection was still common         | Zoneless by default for new apps                         | Less monkey-patching, clearer update model, smaller runtime dependency |
| Local state                   | Class fields, RxJS, or basic `signal()`                 | `signal()` as the default local reactive state primitive | Fine-grained state tracking and clearer updates                        |
| Derived state                 | Getters or `computed()`                                 | `computed()`                                             | Lazy, memoized, and easier to reason about                             |
| Writable derived state        | Often handled with `effect()` or manual synchronization | `linkedSignal()`                                         | Keeps state synchronized while still allowing manual overrides         |
| Async data from Promise/fetch | Manual `loading`, `error`, `data` fields                | `resource({ params, loader })`                           | Centralized async state, cancellation, reload, status tracking         |
| Async data from Observable    | `HttpClient.get().subscribe()` or `AsyncPipe`           | `rxResource({ params, stream })`                         | Observable data becomes signal-style async state                       |
| HTTP data fetching            | `HttpClient` + Observable + manual state                | `httpResource()` or `rxResource()`                       | Signal-based data access with loading/error/status state               |
| Component input               | `@Input()` or `input()`                                 | `input()`                                                | Signal-based input, easier to compose with `computed()`                |
| Two-way component binding     | `@Input()` + `@Output() valueChange`                    | `model()`                                                | Creates a writable signal input and matching change output             |
| Output events                 | `@Output() event = new EventEmitter()`                  | `output()`                                               | Cleaner event declaration and stronger modern component API            |
| Template variable             | `*ngIf="value as user"` or template refs                | `@let user = expression;`                                | Reusable local values without structural directive tricks              |
| Conditional rendering         | `*ngIf`, `else`, `ng-template`                          | `@if`, `@else if`, `@else`                               | More readable and JavaScript-like                                      |
| List rendering                | `*ngFor`, optional `trackBy`                            | `@for (item of items; track item.id)`                    | Stable tracking is mandatory, fewer list rendering mistakes            |
| Empty list state              | Separate `*ngIf` or manual logic                        | `@empty` inside `@for`                                   | Cleaner template structure                                             |
| Switch rendering              | `[ngSwitch]`, `*ngSwitchCase`                           | `@switch`, `@case`, `@default`                           | Cleaner multi-branch logic                                             |
| Lazy template loading         | Router lazy loading or manual dynamic imports           | `@defer`                                                 | Lazy-loads template blocks directly                                    |
| Side effects                  | Commonly used for state synchronization                 | `effect()` only for real side effects                    | Reduces accidental loops and unnecessary updates                       |
| Component architecture        | Module-heavy or mixed standalone usage                  | Standalone-first, signal-first                           | Less boilerplate, easier composition                                   |
| Reactivity style              | RxJS-heavy for most reactive state                      | Signals for UI state, RxJS for streams                   | Better separation between UI state and event/data streams              |

---

# Recommended Angular 21 Architecture

## 1. State hierarchy

```txt
Server data
→ resource() / rxResource() / httpResource()

Local writable UI state
→ signal() / model()

Read-only derived state
→ computed()

Derived but user-overridable state
→ linkedSignal()

Imperative side effects
→ effect()
```

---

## 2. API decision table

| Problem                                          | Best Angular 21 API |
| ------------------------------------------------ | ------------------- |
| Local counter, toggle, selected ID               | `signal()`          |
| Derived label, filtered list, total price        | `computed()`        |
| Selected item from a changing list               | `linkedSignal()`    |
| Custom component two-way binding                 | `model()`           |
| Fetch with `fetch` or Promise                    | `resource()`        |
| Fetch with Observable service                    | `rxResource()`      |
| Fetch with Angular `HttpClient` stack            | `httpResource()`    |
| Logging, localStorage, chart library integration | `effect()`          |
| Local template alias                             | `@let`              |
| Conditional UI                                   | `@if`               |
| List UI                                          | `@for`              |
| Lazy non-critical UI                             | `@defer`            |

---

# Anti-patterns to avoid in Angular 21

## 1. Do not use `effect()` to copy state

Avoid:

```ts
effect(() => {
  this.selectedUser.set(this.users()[0]);
});
```

Prefer:

```ts
selectedUser = linkedSignal({
  source: this.users,
  computation: users => users[0] ?? null,
});
```

---

## 2. Do not silently mutate arrays or objects

Avoid:

```ts
this.users().push(newUser);
```

Prefer:

```ts
this.users.update(users => [...users, newUser]);
```

---

## 3. Do not read resource values without guarding

Avoid:

```ts
const user = this.userResource.value();
```

Prefer:

```ts
const user = this.userResource.hasValue()
  ? this.userResource.value()
  : null;
```

---

## 4. Do not pass called signals into `model()` two-way binding

Avoid:

```html
<app-user-search-picker [(query)]="searchQuery()" />
```

Prefer:

```html
<app-user-search-picker [(query)]="searchQuery" />
```

---

## 5. Do not use `track $index` for dynamic lists

Avoid:

```html
@for (user of users; track $index) {
  <app-user-card [user]="user" />
}
```

Prefer:

```html
@for (user of users; track user.id) {
  <app-user-card [user]="user" />
}
```

`track $index` is only acceptable for static lists that never reorder, insert, delete, or filter.

---

# Senior-level Mental Model

| Concept          | Think of it as               |
| ---------------- | ---------------------------- |
| Zoneless Angular | Explicit UI update model     |
| Signal           | Reactive value               |
| `computed()`     | Cached derived state         |
| `linkedSignal()` | Writable derived state       |
| `resource()`     | Promise-based async state    |
| `rxResource()`   | Observable-based async state |
| `model()`        | Two-way signal input         |
| `@let`           | Local template alias         |
| `@if`            | Template branching           |
| `@for`           | Fast tracked list rendering  |
| `@switch`        | Template switch statement    |
| `@defer`         | Lazy template block          |
| `effect()`       | Side-effect bridge           |

---

# Key Takeaways

Angular 21 is a major shift toward a **signal-first, zoneless, standalone-first architecture**.

The most important ideas to master are:

1. **Zoneless is the default**
   Angular no longer depends on Zone.js for new apps. State updates should be explicit and signal-driven.

2. **Signals are the foundation of UI state**
   Use `signal()` for writable state and `computed()` for derived state.

3. **Use `linkedSignal()` for synchronized writable state**
   It is ideal when a value depends on another signal but can still be manually changed.

4. **Use Resource APIs for async state**
   Use `resource()` for Promise/fetch, `rxResource()` for Observables, and `httpResource()` for Angular HTTP workflows.

5. **Use `model()` for modern two-way component binding**
   It replaces a lot of manual `@Input()` + `@Output()` boilerplate.

6. **Use `@let` for clean templates**
   It reduces repeated expressions and makes resource-heavy templates much easier to read.

A strong Angular 21 codebase should generally look like this:

```txt
Standalone components
+ Zoneless by default
+ Signals for state
+ computed() for derived values
+ linkedSignal() for synchronized writable state
+ resource() / rxResource() for async data
+ model() for two-way binding
+ @let / @if / @for / @switch for clean templates
+ @defer for non-critical heavy UI
```
