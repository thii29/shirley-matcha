Vietnam version
# Angular v17 Review Cheat Sheet — Vietnamese Edition

## Part 1: Core Concepts & Fundamentals

### 1. Component — “Building block” chính của UI

Một **Component** là đơn vị UI cơ bản nhất trong Angular. Mỗi component thường có 3 phần: TypeScript class để xử lý logic, HTML template để render DOM, và CSS selector để component được dùng trong template khác. ([angular.dev][2])

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <article class="card">
      <h3>{{ name() }}</h3>
      <button type="button" (click)="selected.emit(name())">
        Select
      </button>
    </article>
  `,
})
export class UserCardComponent {
  name = input.required<string>();
  selected = output<string>();
}
```

**Vai trò trong architecture:**

Component nên tập trung vào UI, presentation logic, user interaction, và binding dữ liệu. Logic dùng lại được, gọi API, state dùng chung nên đưa sang service để component không bị “fat component”. Angular style guide cũng khuyến nghị giữ component/directive tập trung vào phần hiển thị. ([angular.dev][3])

---

### 2. Directive — thay đổi behavior hoặc structure của DOM

Angular có 2 nhóm directive quan trọng:

| Loại                     | Vai trò                                      | Ví dụ truyền thống                         |
| ------------------------ | -------------------------------------------- | ------------------------------------------ |
| **Structural Directive** | Thay đổi cấu trúc DOM: thêm/xóa/render block | `*ngIf`, `*ngFor`, `*ngSwitch`             |
| **Attribute Directive**  | Thay đổi behavior/style của element hiện có  | `[ngClass]`, `[ngStyle]`, custom directive |

```ts
import { Directive, HostBinding, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  appHighlight = input(false);

  @HostBinding('class.is-highlighted')
  get highlighted(): boolean {
    return this.appHighlight();
  }
}
```

```html
<p [appHighlight]="isActive">Important text</p>
```

**Vai trò trong architecture:**

Directive dùng khi bạn muốn tái sử dụng behavior trên nhiều element mà không cần tạo component mới. Component là UI block; directive là behavior gắn thêm vào DOM.

---

### 3. Service — nơi đặt business logic, API, shared state

Service là TypeScript class thường được đánh dấu bằng `@Injectable()`. Angular docs mô tả service là cách phổ biến để chia sẻ dữ liệu và functionality giữa nhiều phần của ứng dụng, ví dụ data client, state management, business logic. ([angular.dev][4])

```ts
import { Injectable, signal, computed } from '@angular/core';

export interface Todo {
  id: number;
  title: string;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly todos = signal<Todo[]>([]);

  readonly completedCount = computed(() =>
    this.todos().filter(todo => todo.done).length
  );

  add(title: string): void {
    const todo: Todo = {
      id: crypto.randomUUID() as unknown as number,
      title,
      done: false,
    };

    this.todos.update(items => [...items, todo]);
  }

  all(): Todo[] {
    return this.todos();
  }
}
```

**Vai trò trong architecture:**

Service giúp tách UI khỏi business logic. Component chỉ gọi service và hiển thị state; service xử lý logic, API, cache, shared state.

---

### 4. Dependency Injection — cơ chế cấp dependency tự động

**Dependency Injection**, hay DI, là cơ chế Angular dùng để cấp dependency như service, config, factory cho component/directive/service. Angular docs nói component và directive tự động tham gia DI, nghĩa là chúng có thể inject dependency và cũng có thể cung cấp dependency cho nơi khác. ([angular.dev][4])

```ts
import { Component, inject } from '@angular/core';
import { TodoStore } from './todo.store';

@Component({
  selector: 'app-todos',
  standalone: true,
  template: `
    <p>Completed: {{ store.completedCount() }}</p>
  `,
})
export class TodosComponent {
  protected readonly store = inject(TodoStore);
}
```

**Best practice v17+:**

Ưu tiên `inject()` khi dependency là property, đặc biệt trong standalone component/service hiện đại.

```ts
private readonly http = inject(HttpClient);
private readonly router = inject(Router);
```

---

### 5. Lifecycle Hooks — vòng đời của component/directive

Lifecycle hook cho phép bạn chạy code tại các giai đoạn cụ thể: khởi tạo, input thay đổi, view/content được render, destroy. Angular docs mô tả lifecycle là chuỗi bước từ lúc component được tạo đến lúc bị hủy, gắn chặt với quá trình Angular render và check binding. ([angular.dev][5])

| Hook               | Khi nào dùng                              |
| ------------------ | ----------------------------------------- |
| `constructor`      | Inject dependency, setup đơn giản         |
| `ngOnInit`         | Init data sau khi input đầu tiên đã có    |
| `ngOnChanges`      | React khi `@Input()` thay đổi             |
| `ngAfterViewInit`  | DOM/view child đã init                    |
| `ngOnDestroy`      | Cleanup subscription, listener, timer     |
| `afterNextRender`  | Chạy một lần sau lần render DOM tiếp theo |
| `afterEveryRender` | Chạy sau mỗi lần toàn app render xong     |

Angular docs liệt kê thêm các render callbacks như `afterNextRender` và `afterEveryRender`; các callback này chạy sau khi tất cả component đã được render vào DOM, và thường được gọi trong injection context như constructor. ([angular.dev][5])

```ts
import {
  Component,
  afterNextRender,
  DestroyRef,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas id="salesChart"></canvas>`,
})
export class ChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      // Safe place for browser-only DOM/chart initialization.
      const canvas = document.querySelector('#salesChart');
      // initChart(canvas)
    });

    this.destroyRef.onDestroy(() => {
      // cleanup chart instance, listener, timer...
    });
  }
}
```

---

## Part 2: Groundbreaking Features & Syntax Shifts in v17

## 1. Built-in Control Flow

Angular v17 giới thiệu **built-in control flow** với block syntax mới: `@if`, `@for`, `@switch`. Angular team nói syntax mới này gần JavaScript hơn, type checking tốt hơn, tự động có trong template mà không cần import directive, giảm runtime footprint, và có thể cải thiện bundle/Core Web Vitals. ([Angular Blog][6])

---

### 1.1 `@if` — thay thế `*ngIf`

#### Before — `*ngIf`

```html
<div *ngIf="user; else guest">
  Welcome, {{ user.name }}
</div>

<ng-template #guest>
  Please sign in.
</ng-template>
```

#### Angular v17 — `@if`

```html
@if (user) {
  <p>Welcome, {{ user.name }}</p>
} @else {
  <p>Please sign in.</p>
}
```

#### Với `@else if`

```html
@if (status === 'loading') {
  <app-spinner />
} @else if (status === 'error') {
  <app-error-message />
} @else {
  <app-dashboard />
}
```

**Điểm mạnh:**
`@else` và `@else if` nằm trực tiếp trong cùng block, không cần `ng-template`, dễ đọc hơn nhiều so với `*ngIf`. Angular team cũng nhấn mạnh `@else if` là thứ trước đây không tiện hoặc không trực tiếp với `*ngIf`. ([Angular Blog][6])

---

### 1.2 `@for` — thay thế `*ngFor`

#### Before — `*ngFor`

```html
<li *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</li>
```

```ts
trackByUserId(index: number, user: User): number {
  return user.id;
}
```

#### Angular v17 — `@for`

```html
@for (user of users; track user.id) {
  <li>{{ user.name }}</li>
} @empty {
  <li>No users found.</li>
}
```

### Mandatory `track` expression

Trong `@for`, `track` là **bắt buộc**. Angular team giải thích rằng nhiều vấn đề performance trong app đến từ việc thiếu `trackBy` trong `*ngFor`; vì vậy `@for` bắt buộc `track` để đảm bảo diffing nhanh. Ngoài ra, `track` chỉ là expression trong template, không cần viết method riêng trong component class. ([Angular Blog][6])

```html
@for (product of products; track product.id) {
  <app-product-card [product]="product" />
}
```

**Nên dùng:**

```html
track user.id
track product.sku
track todo.id
```

**Tránh dùng khi list có reorder/update thường xuyên:**

```html
track $index
```

`track $index` chỉ hợp lý khi list static, không sort, không insert/delete ở giữa.

---

### Context variables trong `@for`

```html
@for (item of items; track item.id; let i = $index; let first = $first) {
  <div>
    {{ i + 1 }}. {{ item.name }}
    @if (first) {
      <span>First item</span>
    }
  </div>
}
```

Các biến thường dùng:

| Variable | Ý nghĩa        |
| -------- | -------------- |
| `$index` | index hiện tại |
| `$count` | tổng số item   |
| `$first` | item đầu tiên  |
| `$last`  | item cuối      |
| `$even`  | index chẵn     |
| `$odd`   | index lẻ       |

---

### 1.3 `@switch` — thay thế `*ngSwitch`

#### Before — `*ngSwitch`

```html
<div [ngSwitch]="role">
  <app-admin *ngSwitchCase="'admin'" />
  <app-editor *ngSwitchCase="'editor'" />
  <app-viewer *ngSwitchDefault />
</div>
```

#### Angular v17 — `@switch`

```html
@switch (role) {
  @case ('admin') {
    <app-admin />
  }
  @case ('editor') {
    <app-editor />
  }
  @default {
    <app-viewer />
  }
}
```

Angular docs mô tả `@switch` có syntax gần với JavaScript `switch`, và Angular team nhấn mạnh nó cải thiện type narrowing trong từng branch tốt hơn `*ngSwitch`. ([angular.dev][7])

---

## 2. Deferrable Views — `@defer`

`@defer` cho phép bạn lazy-load một phần template. Angular docs nói deferrable views giúp giảm initial bundle size bằng cách trì hoãn loading code không cần thiết cho initial render, từ đó có thể cải thiện Core Web Vitals như LCP và TTFB. ([angular.dev][8])

### Basic syntax

```html
@defer {
  <app-heavy-chart />
} @placeholder {
  <app-chart-skeleton />
} @loading {
  <p>Loading chart...</p>
} @error {
  <p>Could not load chart.</p>
}
```

**Ý nghĩa:**

| Block          | Vai trò                          |
| -------------- | -------------------------------- |
| `@defer`       | Nội dung chính được lazy-load    |
| `@placeholder` | UI tạm trước khi trigger xảy ra  |
| `@loading`     | UI trong lúc đang tải dependency |
| `@error`       | UI nếu load lỗi                  |

---

### Common triggers

#### 1. `on idle` — mặc định

```html
@defer (on idle) {
  <app-recommendations />
}
```

Dùng cho nội dung không quan trọng ở initial render.

---

#### 2. `on viewport`

```html
@defer (on viewport) {
  <app-comments />
} @placeholder {
  <app-comments-placeholder />
}
```

Dùng khi component chỉ cần tải khi scroll tới vùng đó.

---

#### 3. `on hover`

```html
@defer (on hover) {
  <app-user-preview />
} @placeholder {
  <button type="button">Hover to preview</button>
}
```

Dùng cho preview, tooltip phức tạp, menu nặng.

---

#### 4. `on interaction`

```html
@defer (on interaction) {
  <app-feedback-form />
} @placeholder {
  <button type="button">Give feedback</button>
}
```

Dùng khi chỉ cần load sau click/input/focus của user.

---

#### 5. Kết hợp trigger

```html
@defer (on viewport; prefetch on idle) {
  <app-product-reviews />
} @placeholder {
  <app-review-skeleton />
}
```

Pattern tốt: **prefetch nhẹ khi idle**, render thật khi user scroll tới.

---

### Khi nào nên dùng `@defer`?

Nên dùng cho:

* Component nặng: chart, map, rich editor, calendar.
* Section nằm dưới fold: comments, reviews, recommendations.
* Feature ít dùng: export modal, settings panel, advanced filters.
* Third-party dependency lớn.

Không nên dùng cho:

* Navbar/header chính.
* Hero content ảnh hưởng LCP.
* Form/login critical path.
* UI cần xuất hiện ngay khi page load.

---

## 3. Signals trong Angular v17

Signals là hướng reactivity mới của Angular. Angular docs mô tả computed signals là lazy và memoized: chỉ tính khi được đọc lần đầu, cache kết quả, và chỉ tính lại khi dependency thay đổi. Computed signal cũng không writable. ([angular.dev][9])

### 3.1 Writable Signal

```ts
import { signal } from '@angular/core';

const count = signal(0);

count.set(1);
count.update(value => value + 1);

console.log(count());
```

Dùng cho state có thể thay đổi trực tiếp.

---

### 3.2 Computed Signal

```ts
import { computed, signal } from '@angular/core';

const price = signal(100);
const quantity = signal(2);

const total = computed(() => price() * quantity());

console.log(total()); // 200
```

Dùng cho derived state. Không nên `.set()` computed signal.

---

### 3.3 Effect

```ts
import { effect, signal } from '@angular/core';

const searchTerm = signal('');

effect(() => {
  console.log('Search changed:', searchTerm());
});
```

Dùng khi cần side effect: logging, sync localStorage, gọi API có kiểm soát.

**Nguyên tắc senior-level:**

Ưu tiên:

```ts
computed()
```

cho derived state.

Chỉ dùng:

```ts
effect()
```

khi thật sự cần side effect.

---

### Signals thay đổi reactivity model như thế nào?

Trước đây Angular thường dựa nhiều vào Zone.js + change detection toàn cây component. Signals mở đường cho mô hình reactive fine-grained hơn: nơi nào đọc signal thì nơi đó có thể được cập nhật chính xác hơn khi signal đổi. Angular v17 chưa “xóa bỏ” RxJS hoặc Zone.js, nhưng Signals là nền móng cho hướng reactive hiện đại hơn của Angular.

```ts
@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <button type="button" (click)="decrease()">-</button>
    <strong>{{ count() }}</strong>
    <button type="button" (click)="increase()">+</button>

    <p>Double: {{ doubleCount() }}</p>
  `,
})
export class CounterComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increase(): void {
    this.count.update(value => value + 1);
  }

  decrease(): void {
    this.count.update(value => value - 1);
  }
}
```

---

## Part 3: Performance, Efficiency & Developer Experience

## 1. Faster build với Vite + esbuild

Angular v17 đưa build system mới dựa trên **esbuild** và **Vite dev server** thành default cho new projects. Angular team công bố build system mới trong v17, và các nguồn tổng hợp từ release notes cũng nêu production build trung bình cải thiện đáng kể. ([Angular Blog][6])

### Ý nghĩa thực tế

| Trước đây                          | Angular v17                     |
| ---------------------------------- | ------------------------------- |
| Webpack-based builder phổ biến     | Application builder mới         |
| Dev server chậm hơn ở project lớn  | Vite dev server nhanh hơn       |
| Build production tốn thời gian hơn | esbuild cải thiện build speed   |
| SSR setup phức tạp hơn             | SSR prompt/package cải thiện DX |

---

## 2. SSR, Prerendering, Hydration

Angular v17 cải thiện mạnh trải nghiệm SSR/hybrid rendering. Angular team nhấn mạnh v17 có trải nghiệm SSR/hydration tốt hơn, trong đó hydration trở nên production-ready và SSR dễ bật hơn khi tạo project mới. ([Angular Blog][6])

### Khái niệm nhanh

| Concept                | Ý nghĩa                                                   |
| ---------------------- | --------------------------------------------------------- |
| **SSR**                | Render HTML trên server cho request                       |
| **Prerendering / SSG** | Generate HTML trước tại build time                        |
| **Hydration**          | Client-side Angular “gắn lại” behavior vào HTML đã render |
| **Hybrid rendering**   | Kết hợp CSR, SSR, prerender tùy route/use case            |

### Tại sao quan trọng?

* First paint nhanh hơn.
* SEO tốt hơn cho public pages.
* Giảm blank screen.
* Hydration tránh render lại toàn bộ DOM không cần thiết.

---

## 3. Vì sao `@for` nhanh hơn `*ngFor` với `trackBy`?

Angular team nói `@for` dùng diffing algorithm mới, implementation tối ưu hơn `*ngFor`, và trong benchmark cộng đồng có thể nhanh hơn tới 90% runtime. ([Angular Blog][6])

### Lý do chính

#### 1. `track` là bắt buộc

Với `*ngFor`, nhiều developer quên `trackBy`, khiến Angular khó biết item nào là item cũ khi array thay đổi.

```html
<!-- Risky: no trackBy -->
<li *ngFor="let user of users">
  {{ user.name }}
</li>
```

Với `@for`, Angular ép bạn khai báo identity:

```html
@for (user of users; track user.id) {
  <li>{{ user.name }}</li>
}
```

Khi identity rõ ràng, Angular có thể reuse DOM node tốt hơn thay vì destroy/create lại quá nhiều.

---

#### 2. Không cần directive instance như `NgForOf`

Built-in control flow là compiler-level syntax. Angular team nói block syntax được compiler transform thành JavaScript instructions hiệu quả hơn, giảm runtime footprint. ([Angular Blog][6])

---

#### 3. `track` là expression, không phải function call pattern

`*ngFor trackBy` thường cần method:

```ts
trackByUserId(index: number, user: User): number {
  return user.id;
}
```

`@for` dùng expression trực tiếp:

```html
@for (user of users; track user.id) {
  ...
}
```

Code ngắn hơn, ít boilerplate hơn, dễ audit performance hơn.

---

# Production-ready Patterns cho Angular v17

## Pattern 1: Standalone component + built-in control flow

```ts
import { Component, input } from '@angular/core';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    @if (users().length > 0) {
      <ul>
        @for (user of users(); track user.id) {
          <li>
            <strong>{{ user.name }}</strong>

            @switch (user.role) {
              @case ('admin') {
                <span>Admin</span>
              }
              @case ('editor') {
                <span>Editor</span>
              }
              @default {
                <span>Viewer</span>
              }
            }
          </li>
        }
      </ul>
    } @else {
      <p>No users available.</p>
    }
  `,
})
export class UserListComponent {
  users = input.required<User[]>();
}
```

---

## Pattern 2: Signal-based local state

```ts
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: `
    <input
      type="search"
      [value]="query()"
      (input)="query.set($any($event.target).value)"
      placeholder="Search users..."
    />

    <p>{{ resultLabel() }}</p>
  `,
})
export class SearchBoxComponent {
  query = signal('');

  resultLabel = computed(() => {
    const value = this.query().trim();

    return value
      ? `Searching for "${value}"`
      : 'Type to search';
  });
}
```

---

## Pattern 3: `@defer` cho heavy component

```html
<section>
  <h2>Analytics</h2>

  @defer (on viewport; prefetch on idle) {
    <app-analytics-dashboard />
  } @placeholder {
    <app-analytics-skeleton />
  } @loading {
    <p>Loading analytics...</p>
  } @error {
    <p>Analytics could not be loaded.</p>
  }
</section>
```

---

# Migration Checklist từ Angular cũ lên v17

## Template

* Thay `*ngIf` bằng `@if`.
* Thay `*ngFor` bằng `@for`.
* Luôn chọn `track` stable: `id`, `uuid`, `slug`, `sku`.
* Thay `*ngSwitch` bằng `@switch`.
* Thêm `@empty` cho empty list.

Angular team cung cấp migration command cho built-in control flow: ([Angular Blog][6])

```bash
ng generate @angular/core:control-flow
```

## Component

* Ưu tiên standalone component.
* Dùng `inject()` cho dependency.
* Dùng Signals cho local UI state.
* Dùng RxJS khi xử lý stream async phức tạp: HTTP streams, websocket, debounce, cancellation.

## Performance

* Dùng `@defer` cho component/dependency nặng.
* Không defer content critical cho LCP.
* Audit list rendering: mọi list dynamic phải có stable identity.
* Dùng hydration/SSR cho public page cần SEO hoặc first paint tốt.

---

# Mental Model ngắn gọn

| Feature           | Hãy nghĩ như                           |
| ----------------- | -------------------------------------- |
| Component         | UI block                               |
| Directive         | Behavior gắn vào DOM                   |
| Service           | Business logic/shared state            |
| DI                | Dependency wiring system               |
| Lifecycle Hooks   | Điểm can thiệp theo vòng đời           |
| Signals           | Reactive state primitive               |
| `@if` / `@switch` | Template branching mới                 |
| `@for`            | Loop nhanh, bắt buộc identity          |
| `@defer`          | Lazy-load template block               |
| Hydration         | Làm HTML từ server trở nên interactive |

---

# Key Takeaways

Angular v17 là một bản nâng cấp lớn về **template syntax, performance và developer experience**. Ba thay đổi bạn nên master trước là:

1. **Built-in Control Flow**: dùng `@if`, `@for`, `@switch` thay cho syntax structural directive cũ.
2. **`@defer`**: lazy-load component/template block trực tiếp trong template.
3. **Signals**: mô hình reactive state mới, rõ ràng hơn cho local/derived state.

Với codebase mới, hãy viết theo style: **standalone components + built-in control flow + signals + defer heavy UI + SSR/hydration khi cần SEO/performance**.

[1]: https://v17.angular.io/docs "Angular"
[2]: https://angular.dev/guide/components?utm_source=chatgpt.com "Anatomy of components"
[3]: https://angular.dev/style-guide?utm_source=chatgpt.com "Angular coding style guide"
[4]: https://angular.dev/guide/di?utm_source=chatgpt.com "Dependency Injection • Overview"
[5]: https://angular.dev/guide/components/lifecycle?utm_source=chatgpt.com "Component Lifecycle"
[6]: https://blog.angular.dev/introducing-angular-v17-4d7033312e4b?utm_source=chatgpt.com "Introducing Angular v17"
[7]: https://angular.dev/guide/templates/control-flow?utm_source=chatgpt.com "Control flow"
[8]: https://angular.dev/guide/templates/defer?utm_source=chatgpt.com "Deferred loading with @defer"
[9]: https://angular.dev/guide/signals?utm_source=chatgpt.com "Signals • Overview • Angular"


---
English version

# Angular v17 Review Cheat Sheet

## Part 1: Core Concepts & Fundamentals

## 1. Components

A **component** is the main building block of an Angular application. It controls a section of the UI through a TypeScript class, an HTML template, and optional styles.

```ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <article class="card">
      <h3>{{ name() }}</h3>

      <button type="button" (click)="selected.emit(name())">
        Select
      </button>
    </article>
  `,
})
export class UserCardComponent {
  name = input.required<string>();
  selected = output<string>();
}
```

### Role in Angular architecture

Components should mainly handle:

| Responsibility     | Description                             |
| ------------------ | --------------------------------------- |
| UI rendering       | Display data in the template            |
| User interaction   | Handle clicks, inputs, forms            |
| Template binding   | Connect data and DOM                    |
| Presentation logic | Keep UI-related logic close to the view |

A good Angular component should not contain too much business logic. Shared logic should usually move into services.

---

## 2. Directives

A **directive** changes the behavior or structure of DOM elements.

Angular has two major types of directives:

| Type                  | Purpose                                                      | Examples                                    |
| --------------------- | ------------------------------------------------------------ | ------------------------------------------- |
| Structural directives | Add, remove, or repeat DOM blocks                            | `*ngIf`, `*ngFor`, `*ngSwitch`              |
| Attribute directives  | Change behavior, style, or appearance of an existing element | `[ngClass]`, `[ngStyle]`, custom directives |

Example custom attribute directive:

```ts
import { Directive, HostBinding, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  appHighlight = input(false);

  @HostBinding('class.is-highlighted')
  get highlighted(): boolean {
    return this.appHighlight();
  }
}
```

```html
<p [appHighlight]="isActive">
  Important text
</p>
```

### Role in Angular architecture

Use a directive when you want to reuse behavior across multiple elements without creating a full component.

A simple way to think about it:

| Concept   | Mental model                             |
| --------- | ---------------------------------------- |
| Component | A reusable UI block                      |
| Directive | Reusable behavior attached to an element |

---

## 3. Services

A **service** is a class used to hold reusable logic, shared state, API calls, or business rules.

```ts
import { Injectable, computed, signal } from '@angular/core';

export interface Todo {
  id: string;
  title: string;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly todos = signal<Todo[]>([]);

  readonly completedCount = computed(() =>
    this.todos().filter(todo => todo.done).length
  );

  all(): Todo[] {
    return this.todos();
  }

  add(title: string): void {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title,
      done: false,
    };

    this.todos.update(items => [...items, todo]);
  }
}
```

### Role in Angular architecture

Services are commonly used for:

| Use case          | Example                            |
| ----------------- | ---------------------------------- |
| API communication | `UserApiService`, `AuthApiService` |
| Shared state      | `TodoStore`, `CartStore`           |
| Business logic    | Pricing, permissions, validation   |
| Utility logic     | Date formatting, file helpers      |

A clean architecture usually keeps components thin and moves reusable logic into services.

---

## 4. Dependency Injection

**Dependency Injection**, or DI, is Angular’s system for providing dependencies to classes automatically.

Instead of manually creating a service with `new`, Angular injects it for you.

```ts
import { Component, inject } from '@angular/core';
import { TodoStore } from './todo.store';

@Component({
  selector: 'app-todos',
  standalone: true,
  template: `
    <p>Completed: {{ store.completedCount() }}</p>
  `,
})
export class TodosComponent {
  protected readonly store = inject(TodoStore);
}
```

### Recommended modern style

In Angular v17 projects, `inject()` is often cleaner than constructor injection, especially in standalone components and services.

```ts
private readonly http = inject(HttpClient);
private readonly router = inject(Router);
private readonly store = inject(TodoStore);
```

### Role in Angular architecture

DI helps Angular applications stay:

| Benefit      | Explanation                                  |
| ------------ | -------------------------------------------- |
| Decoupled    | Classes do not create their own dependencies |
| Testable     | Dependencies can be mocked                   |
| Scalable     | Services can be provided at different levels |
| Maintainable | Shared logic is easier to manage             |

---

## 5. Lifecycle Hooks

Lifecycle hooks let you run code at specific stages of a component’s life.

| Hook               | When it runs                            | Common use                               |
| ------------------ | --------------------------------------- | ---------------------------------------- |
| `constructor`      | When the class is created               | Inject dependencies                      |
| `ngOnInit`         | After initial inputs are set            | Initial data loading                     |
| `ngOnChanges`      | When input values change                | React to input updates                   |
| `ngAfterViewInit`  | After the component view is initialized | Access view children or DOM              |
| `ngOnDestroy`      | Before the component is destroyed       | Cleanup subscriptions, timers, listeners |
| `afterNextRender`  | After the next DOM render               | Browser-only DOM logic                   |
| `afterEveryRender` | After every DOM render                  | Repeated render callbacks                |

Example:

```ts
import {
  Component,
  afterNextRender,
  DestroyRef,
  inject,
} from '@angular/core';

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas id="salesChart"></canvas>`,
})
export class ChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const canvas = document.querySelector('#salesChart');
      // Initialize chart here
    });

    this.destroyRef.onDestroy(() => {
      // Cleanup chart instance, event listeners, timers, etc.
    });
  }
}
```

---

# Part 2: Groundbreaking Features & Syntax Shifts in v17

## 1. Built-in Control Flow

Angular v17 introduced a new template control flow syntax:

```html
@if (...) { ... }
@for (...) { ... }
@switch (...) { ... }
```

This new syntax replaces many common use cases for:

```html
*ngIf
*ngFor
*ngSwitch
```

The new syntax is easier to read, closer to JavaScript, and does not require importing structural directives.

---

## 1.1 `@if`

### Traditional syntax: `*ngIf`

```html
<div *ngIf="user; else guest">
  Welcome, {{ user.name }}
</div>

<ng-template #guest>
  Please sign in.
</ng-template>
```

### Angular v17 syntax: `@if`

```html
@if (user) {
  <p>Welcome, {{ user.name }}</p>
} @else {
  <p>Please sign in.</p>
}
```

### With `@else if`

```html
@if (status === 'loading') {
  <app-spinner />
} @else if (status === 'error') {
  <app-error-message />
} @else {
  <app-dashboard />
}
```

### Why it is better

| Old `*ngIf`                          | New `@if`                      |
| ------------------------------------ | ------------------------------ |
| Often requires `ng-template`         | Inline `@else` block           |
| Less readable for complex conditions | Cleaner branching              |
| Awkward `else if` pattern            | Native `@else if` support      |
| Directive-based                      | Built into the template syntax |

---

## 1.2 `@for`

### Traditional syntax: `*ngFor`

```html
<li *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</li>
```

```ts
trackByUserId(index: number, user: User): number {
  return user.id;
}
```

### Angular v17 syntax: `@for`

```html
@for (user of users; track user.id) {
  <li>{{ user.name }}</li>
} @empty {
  <li>No users found.</li>
}
```

## The `track` expression is mandatory

In Angular v17, `@for` requires a `track` expression.

This is important because Angular needs a stable identity for each item in the list. With a stable identity, Angular can reuse DOM nodes efficiently instead of destroying and recreating them unnecessarily.

Good examples:

```html
@for (user of users; track user.id) {
  <app-user-card [user]="user" />
}
```

```html
@for (product of products; track product.sku) {
  <app-product-card [product]="product" />
}
```

```html
@for (todo of todos; track todo.id) {
  <app-todo-item [todo]="todo" />
}
```

Use stable unique values such as:

| Good tracking value | Why                         |
| ------------------- | --------------------------- |
| `user.id`           | Stable database identity    |
| `product.sku`       | Stable product identity     |
| `todo.id`           | Stable local state identity |
| `item.uuid`         | Stable generated identity   |

Avoid this for dynamic lists:

```html
@for (item of items; track $index) {
  <p>{{ item.name }}</p>
}
```

`track $index` is only safe when the list is static and will not be reordered, filtered, inserted into, or deleted from.

---

## Context variables in `@for`

```html
@for (
  item of items;
  track item.id;
  let i = $index;
  let first = $first;
  let last = $last
) {
  <div>
    {{ i + 1 }}. {{ item.name }}

    @if (first) {
      <span>First item</span>
    }

    @if (last) {
      <span>Last item</span>
    }
  </div>
}
```

Common context variables:

| Variable | Meaning                        |
| -------- | ------------------------------ |
| `$index` | Current index                  |
| `$count` | Total number of items          |
| `$first` | Whether this is the first item |
| `$last`  | Whether this is the last item  |
| `$even`  | Whether the index is even      |
| `$odd`   | Whether the index is odd       |

---

## 1.3 `@switch`

### Traditional syntax: `*ngSwitch`

```html
<div [ngSwitch]="role">
  <app-admin *ngSwitchCase="'admin'" />
  <app-editor *ngSwitchCase="'editor'" />
  <app-viewer *ngSwitchDefault />
</div>
```

### Angular v17 syntax: `@switch`

```html
@switch (role) {
  @case ('admin') {
    <app-admin />
  }

  @case ('editor') {
    <app-editor />
  }

  @default {
    <app-viewer />
  }
}
```

### Why it is better

| Old `*ngSwitch`           | New `@switch`                       |
| ------------------------- | ----------------------------------- |
| Directive-based syntax    | JavaScript-like syntax              |
| More verbose              | Cleaner and easier to scan          |
| Template can become noisy | Clear case blocks                   |
| Weaker readability        | Better type narrowing and structure |

---

# 2. Deferrable Views: `@defer`

`@defer` allows Angular to lazy-load a part of the template.

This is useful when a component or section is not needed immediately during the first page render.

Example:

```html
@defer {
  <app-heavy-chart />
} @placeholder {
  <app-chart-skeleton />
} @loading {
  <p>Loading chart...</p>
} @error {
  <p>Could not load chart.</p>
}
```

## Main blocks

| Block          | Purpose                              |
| -------------- | ------------------------------------ |
| `@defer`       | The lazy-loaded content              |
| `@placeholder` | What users see before loading starts |
| `@loading`     | What users see while loading         |
| `@error`       | What users see if loading fails      |

---

## Common `@defer` triggers

## 1. `on idle`

```html
@defer (on idle) {
  <app-recommendations />
}
```

Use this for non-critical content that can load when the browser is idle.

---

## 2. `on viewport`

```html
@defer (on viewport) {
  <app-comments />
} @placeholder {
  <app-comments-placeholder />
}
```

Use this when the content should load only after it becomes visible in the viewport.

Good for:

* Comments
* Reviews
* Related products
* Below-the-fold sections

---

## 3. `on hover`

```html
@defer (on hover) {
  <app-user-preview />
} @placeholder {
  <button type="button">Hover to preview</button>
}
```

Use this for previews, tooltips, popovers, or complex hover content.

---

## 4. `on interaction`

```html
@defer (on interaction) {
  <app-feedback-form />
} @placeholder {
  <button type="button">Give feedback</button>
}
```

Use this when the content is only needed after the user clicks, focuses, or interacts.

---

## 5. Prefetching

```html
@defer (on viewport; prefetch on idle) {
  <app-product-reviews />
} @placeholder {
  <app-review-skeleton />
}
```

This means:

| Action             | Meaning                                    |
| ------------------ | ------------------------------------------ |
| `prefetch on idle` | Download the code when the browser is idle |
| `on viewport`      | Render it when the user scrolls to it      |

This is a strong production pattern for improving perceived performance.

---

## When to use `@defer`

Use it for:

* Charts
* Maps
* Rich text editors
* Calendars
* Heavy modals
* Comments
* Reviews
* Recommendations
* Advanced filters
* Rarely used features

Avoid it for:

* Header
* Navbar
* Login form
* Hero section
* Above-the-fold critical content
* Anything important for LCP

---

# 3. Signals in Angular v17

Signals are Angular’s modern reactive primitive.

They provide a simpler way to manage reactive state compared with relying only on class properties, RxJS streams, or full change detection cycles.

Angular has three important signal concepts:

| Signal type     | Purpose                                   |
| --------------- | ----------------------------------------- |
| Writable Signal | State that can be changed                 |
| Computed Signal | Derived state                             |
| Effect          | Side effect that runs when signals change |

---

## 3.1 Writable Signals

```ts
import { signal } from '@angular/core';

const count = signal(0);

count.set(1);
count.update(value => value + 1);

console.log(count());
```

A writable signal is used for state that can change.

Example inside a component:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <button type="button" (click)="decrease()">-</button>
    <strong>{{ count() }}</strong>
    <button type="button" (click)="increase()">+</button>
  `,
})
export class CounterComponent {
  count = signal(0);

  increase(): void {
    this.count.update(value => value + 1);
  }

  decrease(): void {
    this.count.update(value => value - 1);
  }
}
```

---

## 3.2 Computed Signals

```ts
import { computed, signal } from '@angular/core';

const price = signal(100);
const quantity = signal(2);

const total = computed(() => price() * quantity());

console.log(total());
```

A computed signal is derived from other signals.

Use `computed()` for values that can be calculated from existing state.

```ts
completedCount = computed(() =>
  this.todos().filter(todo => todo.done).length
);
```

Important rule:

```ts
// Good
const total = computed(() => price() * quantity());

// Bad
// total.set(500);
```

A computed signal is read-only.

---

## 3.3 Effects

```ts
import { effect, signal } from '@angular/core';

const searchTerm = signal('');

effect(() => {
  console.log('Search changed:', searchTerm());
});
```

An effect runs when the signals it reads change.

Use effects for side effects such as:

* Logging
* Syncing state to localStorage
* Updating document title
* Triggering non-template logic
* Integrating with external APIs carefully

Senior-level rule:

| Use this     | For                  |
| ------------ | -------------------- |
| `signal()`   | Writable local state |
| `computed()` | Derived state        |
| `effect()`   | Side effects only    |

Do not overuse `effect()` for logic that could be represented as `computed()`.

---

## How Signals change Angular’s reactivity model

Before Signals, Angular applications commonly relied on:

* Zone.js
* Component tree change detection
* RxJS streams
* Manual state updates

Signals introduce a more fine-grained reactive model.

Instead of thinking, “Check the whole component tree,” you can think, “Update the places that depend on this state.”

Example:

```ts
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-price-calculator',
  standalone: true,
  template: `
    <label>
      Price:
      <input
        type="number"
        [value]="price()"
        (input)="price.set(+$any($event.target).value)"
      />
    </label>

    <label>
      Quantity:
      <input
        type="number"
        [value]="quantity()"
        (input)="quantity.set(+$any($event.target).value)"
      />
    </label>

    <p>Total: {{ total() }}</p>
  `,
})
export class PriceCalculatorComponent {
  price = signal(100);
  quantity = signal(1);

  total = computed(() => this.price() * this.quantity());
}
```

---

# Part 3: Performance, Efficiency & Developer Experience

## 1. Faster build times with Vite and esbuild

Angular v17 introduced a new build system based on modern tooling such as **esbuild** and **Vite**.

The result is a better developer experience, especially for larger applications.

| Area                | Improvement                     |
| ------------------- | ------------------------------- |
| Development server  | Faster startup and refresh      |
| Production build    | Faster build pipeline           |
| Local feedback loop | Shorter wait time after changes |
| DX                  | More modern tooling experience  |

### Practical impact

For developers, this means:

* Less time waiting for builds
* Faster local development
* Better performance in large projects
* More modern Angular CLI experience

---

## 2. SSR, Prerendering, and Hydration

Angular v17 improved the SSR and hydration experience.

## Key concepts

| Concept          | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| CSR              | Client-side rendering                                   |
| SSR              | Server-side rendering                                   |
| Prerendering     | Generate static HTML at build time                      |
| Hydration        | Attach Angular behavior to server-rendered HTML         |
| Hybrid rendering | Use different rendering strategies for different routes |

---

## Why hydration matters

Without hydration, a client-side framework may need to recreate DOM that already came from the server.

With hydration, Angular can reuse the existing server-rendered DOM and attach interactivity to it.

Benefits:

* Faster first paint
* Better perceived performance
* Better SEO for public pages
* Less unnecessary DOM recreation
* Better Core Web Vitals potential

---

## When to use SSR or prerendering

Use SSR or prerendering for:

* Marketing pages
* Public product pages
* Blog pages
* Documentation pages
* SEO-heavy pages
* Pages where first load speed matters

CSR is still fine for:

* Admin dashboards
* Internal tools
* Authenticated apps
* Highly interactive app screens
* Pages where SEO is not important

---

# 3. Why `@for` is faster than `*ngFor` with `trackBy`

The new `@for` block was designed for better performance and better developer ergonomics.

## 1. `track` is mandatory

With `*ngFor`, developers often forgot to use `trackBy`.

```html
<!-- Risky for dynamic lists -->
<li *ngFor="let user of users">
  {{ user.name }}
</li>
```

Without `trackBy`, Angular may not efficiently identify which items changed.

With `@for`, tracking is required:

```html
@for (user of users; track user.id) {
  <li>{{ user.name }}</li>
}
```

This makes performance safer by default.

---

## 2. It uses a more optimized diffing strategy

`@for` was designed as part of Angular’s new built-in control flow system.

Because it is built into the template syntax, Angular can compile it more efficiently than the older directive-based approach.

---

## 3. Less boilerplate

Old style:

```html
<li *ngFor="let user of users; trackBy: trackByUserId">
  {{ user.name }}
</li>
```

```ts
trackByUserId(index: number, user: User): number {
  return user.id;
}
```

New style:

```html
@for (user of users; track user.id) {
  <li>{{ user.name }}</li>
}
```

The new syntax is shorter, easier to scan, and easier to review during code reviews.

---

# Production-ready Angular v17 Patterns

## Pattern 1: Standalone component with built-in control flow

```ts
import { Component, input } from '@angular/core';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    @if (users().length > 0) {
      <ul>
        @for (user of users(); track user.id) {
          <li>
            <strong>{{ user.name }}</strong>

            @switch (user.role) {
              @case ('admin') {
                <span>Admin</span>
              }

              @case ('editor') {
                <span>Editor</span>
              }

              @default {
                <span>Viewer</span>
              }
            }
          </li>
        }
      </ul>
    } @else {
      <p>No users available.</p>
    }
  `,
})
export class UserListComponent {
  users = input.required<User[]>();
}
```

---

## Pattern 2: Signal-based local state

```ts
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-search-box',
  standalone: true,
  template: `
    <input
      type="search"
      [value]="query()"
      (input)="query.set($any($event.target).value)"
      placeholder="Search users..."
    />

    <p>{{ resultLabel() }}</p>
  `,
})
export class SearchBoxComponent {
  query = signal('');

  resultLabel = computed(() => {
    const value = this.query().trim();

    return value
      ? `Searching for "${value}"`
      : 'Type to search';
  });
}
```

---

## Pattern 3: Deferring heavy UI

```html
<section>
  <h2>Analytics</h2>

  @defer (on viewport; prefetch on idle) {
    <app-analytics-dashboard />
  } @placeholder {
    <app-analytics-skeleton />
  } @loading {
    <p>Loading analytics...</p>
  } @error {
    <p>Analytics could not be loaded.</p>
  }
</section>
```

---

## Pattern 4: Service-based shared state with Signals

```ts
import { Injectable, computed, signal } from '@angular/core';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly items = signal<CartItem[]>([]);

  readonly totalItems = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this.items().reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )
  );

  add(item: CartItem): void {
    this.items.update(items => [...items, item]);
  }

  clear(): void {
    this.items.set([]);
  }
}
```

---

# Migration Checklist for Angular v17

## Template migration

Replace old structural directives with new built-in control flow:

| Old syntax             | New syntax         |
| ---------------------- | ------------------ |
| `*ngIf`                | `@if`              |
| `*ngFor`               | `@for`             |
| `*ngSwitch`            | `@switch`          |
| `ng-template` for else | `@else`            |
| `trackBy` method       | `track` expression |

Migration command:

```bash
ng generate @angular/core:control-flow
```

---

## Component migration

Prefer:

* Standalone components
* `inject()` for dependencies
* Signals for local state
* `computed()` for derived state
* `@defer` for heavy UI
* `@for` with stable `track` values

Avoid:

* Fat components
* Missing tracking in lists
* Overusing `effect()`
* Deferring critical above-the-fold content
* Putting API logic directly in templates/components

---

## Performance checklist

| Area                   | Recommended action                         |
| ---------------------- | ------------------------------------------ |
| Lists                  | Use `@for` with stable `track`             |
| Heavy components       | Use `@defer`                               |
| Local state            | Use Signals                                |
| Derived state          | Use `computed()`                           |
| Side effects           | Use `effect()` carefully                   |
| Public pages           | Consider SSR or prerendering               |
| Above-the-fold content | Do not defer critical UI                   |
| Build performance      | Use the modern Angular application builder |

---

# Senior-level Mental Model

| Angular concept      | Think of it as                          |
| -------------------- | --------------------------------------- |
| Component            | UI block                                |
| Directive            | DOM behavior                            |
| Service              | Business logic or shared state          |
| Dependency Injection | Dependency management system            |
| Lifecycle Hooks      | Component lifecycle entry points        |
| Signals              | Reactive state primitives               |
| `computed()`         | Derived state                           |
| `effect()`           | Side-effect runner                      |
| `@if`                | Template branching                      |
| `@for`               | High-performance list rendering         |
| `@switch`            | Template multi-branch logic             |
| `@defer`             | Lazy-loaded template block              |
| Hydration            | Making server-rendered HTML interactive |

---

# Key Takeaways

Angular v17 is one of the most important Angular releases because it modernizes both the developer experience and the template syntax.

The most important features to master are:

1. **Built-in Control Flow**
   Use `@if`, `@for`, and `@switch` instead of older structural directive patterns.

2. **Mandatory tracking in `@for`**
   Always use stable tracking values such as `user.id`, `product.sku`, or `todo.id`.

3. **Deferrable Views**
   Use `@defer` to lazy-load non-critical or heavy UI sections.

4. **Signals**
   Use `signal()` for writable state, `computed()` for derived state, and `effect()` only for side effects.

5. **Modern performance model**
   Angular v17 improves build performance, supports better SSR/hydration workflows, and encourages more efficient template rendering.

A strong Angular v17 codebase should generally follow this style:

```txt
Standalone components
+ Built-in control flow
+ Signals for local and shared state
+ @defer for heavy UI
+ Stable track expressions in @for
+ SSR/prerendering where SEO or first load performance matters
```
