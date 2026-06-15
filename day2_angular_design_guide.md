# Day 2 — Angular Frontend Design Guide

A step-by-step plan for the **animal health monitoring** frontend that talks to your Day 1 API. As with Day 1, the point is deliberate, explainable design — standalone components, signals where they fit, RxJS where it fits, reactive forms, and clean routing.

**Target:** Standalone-component Angular app (current default, no `NgModule`), `HttpClient` via functional `inject()`, reactive forms, list/detail/form routing.

**Budget:** ~3–4 hrs. Build one working vertical slice (list → detail → edit) before polishing.

---

## 0. Project skeleton (15 min)

```bash
npm install -g @angular/cli
ng new farm-health-web --standalone --routing --style=css
cd farm-health-web
```

> Recent Angular CLI scaffolds standalone + routing by default, so the flags may be redundant — harmless to be explicit. There's no `AppModule`; bootstrapping happens in `main.ts` via `bootstrapApplication`.

**Target structure** — feature-first, mirrors the backend resources:

```
src/app/
├── app.config.ts           # providers: HttpClient, router
├── app.routes.ts           # route table
├── models/animal.ts        # TS interfaces mirroring the API DTOs
├── services/animal.service.ts
└── animals/
    ├── animal-list/        # list view (OnPush + signal)
    ├── animal-detail/      # single animal + health records
    └── animal-form/        # reactive form for create/edit
```

---

## 1. Wire up app config (10 min)

`HttpClient` isn't provided by default in standalone apps — you opt in. This is itself a talking point (the move away from `HttpClientModule`).

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),  // interceptor optional
  ],
};
```

```typescript
// main.ts
bootstrapApplication(AppComponent, appConfig);
```

> **Talking point:** `bootstrapApplication(AppComponent, appConfig)` replaces the old `platformBrowserDynamic().bootstrapModule(AppModule)`. Providers are now functional (`provideRouter`, `provideHttpClient`) rather than module imports.

---

## 2. Model the data (5 min)

Mirror the API's response DTOs as TS interfaces. Keep create/update shapes separate, same reasoning as the backend DTO split.

```typescript
// models/animal.ts
export interface Animal { id: number; name: string; species: string; farmId: number; }
export interface CreateAnimal { name: string; species: string; farmId: number; }
export interface HealthRecord { id: number; recordedAt: string; status: string; notes?: string; }
```

---

## 3. The service — functional DI + RxJS (30 min)

```typescript
// services/animal.service.ts
@Injectable({ providedIn: 'root' })
export class AnimalService {
  private http = inject(HttpClient);          // functional injection style
  private readonly base = '/api/animals';

  getAll(): Observable<Animal[]> {
    return this.http.get<Animal[]>(this.base);
  }
  getById(id: number): Observable<Animal> {
    return this.http.get<Animal>(`${this.base}/${id}`);
  }
  create(dto: CreateAnimal): Observable<Animal> {
    return this.http.post<Animal>(this.base, dto);
  }
  update(id: number, dto: CreateAnimal): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
```

**Design points:**
- `inject(HttpClient)` instead of constructor injection — the newer style; mention both work, this is current.
- `providedIn: 'root'` = tree-shakable singleton; no need to list it in any providers array.
- Methods return `Observable`s (cold) — nothing fires until a consumer subscribes. This is the RxJS-vs-signals boundary: **async I/O stays RxJS**, local UI state becomes signals.
- **CORS:** during dev, set up an Angular proxy (`proxy.conf.json`) so `/api/*` forwards to the .NET port — avoids CORS config and keeps URLs relative. Mention you'd configure CORS properly in `Program.cs` for production.

```json
// proxy.conf.json  →  ng serve --proxy-config proxy.conf.json
{ "/api": { "target": "https://localhost:5001", "secure": false } }
```

---

## 4. List component — signals + OnPush (40 min)

This is where you show off the modern reactivity story. Convert the HTTP stream to a signal, drive the template off it, and use `OnPush`.

```typescript
// animals/animal-list/animal-list.component.ts
@Component({
  selector: 'app-animal-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './animal-list.component.html',
})
export class AnimalListComponent {
  private service = inject(AnimalService);

  // toSignal bridges the Observable into a signal; loading + data without manual subscribe
  animals = toSignal(this.service.getAll(), { initialValue: [] as Animal[] });
  loading = signal(true);

  constructor() {
    // flip loading off once data arrives
    effect(() => { if (this.animals().length || true) this.loading.set(false); });
  }
}
```

```html
<!-- animal-list.component.html  (new @-control flow, not *ngIf/*ngFor) -->
@if (loading()) {
  <p>Loading…</p>
} @else {
  <ul>
    @for (animal of animals(); track animal.id) {
      <li><a [routerLink]="['/animals', animal.id]">{{ animal.name }} — {{ animal.species }}</a></li>
    } @empty {
      <li>No animals yet.</li>
    }
  </ul>
}
```

**Talking points densely packed here:**
- **`OnPush`** only re-checks on input-reference change, an event from the component, or a **signal it reads** updating — and signals satisfy that automatically. So signals + OnPush = efficient, predictable change detection. This is the canonical "why signals" answer.
- **`toSignal()`** is the bridge from the RxJS world (the HTTP call) into the signal world (template state) — concrete proof you understand they *complement* each other rather than compete.
- **`@if` / `@for` / `@empty`** built-in control flow replaced `*ngIf` / `*ngFor`; `track` is now mandatory and prevents the DOM-thrash N+1 re-render problem.

(If `toSignal` + `effect` feels fiddly for loading state, it's fine to keep an explicit `subscribe` in `ngOnInit` and set two signals — simpler and just as defensible.)

---

## 5. Routing (15 min)

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'animals', pathMatch: 'full' },
  { path: 'animals', component: AnimalListComponent },
  { path: 'animals/new', component: AnimalFormComponent },
  { path: 'animals/:id', component: AnimalDetailComponent },
  { path: 'animals/:id/edit', component: AnimalFormComponent },
];
```

**Design points:**
- Order matters: `animals/new` must come **before** `animals/:id` or "new" gets captured as an id.
- **Lazy loading** is worth a sentence even if you don't do it: `loadComponent: () => import('./animals/animal-detail/...')` defers the bundle until the route is hit.
- In the detail component, read the param reactively:
  ```typescript
  private route = inject(ActivatedRoute);
  // switchMap: when the :id param changes, cancel the in-flight request and fetch the new one
  animal = toSignal(this.route.paramMap.pipe(
    switchMap(p => this.service.getById(Number(p.get('id'))))
  ));
  ```
  > **`switchMap` canonical use:** cancel the previous request when the route param changes — the same reasoning as typeahead. Be ready to contrast with `mergeMap` (concurrent, no cancel) and `concatMap` (queued, in order).

---

## 6. Reactive form for create/edit (40 min)

Reactive over template-driven — the expected choice for anything non-trivial, because the form model lives in the component (testable, explicit validators).

```typescript
// animals/animal-form/animal-form.component.ts
@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './animal-form.component.html',
})
export class AnimalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AnimalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private editId?: number;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    species: ['', Validators.required],
    farmId: [1, Validators.required],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.service.getById(this.editId).subscribe(a => this.form.patchValue(a));
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const dto = this.form.getRawValue();
    const op = this.editId
      ? this.service.update(this.editId, dto)
      : this.service.create(dto);
    op.subscribe(() => this.router.navigate(['/animals']));
  }
}
```

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <input formControlName="name" placeholder="Name" />
  @if (form.controls.name.touched && form.controls.name.invalid) {
    <small>Name is required (max 50).</small>
  }
  <input formControlName="species" placeholder="Species" />
  <button type="submit" [disabled]="form.invalid">Save</button>
</form>
```

**Design points:**
- One component serves create **and** edit, switched by the presence of a route param — less duplication, a deliberate choice you can explain.
- `fb.nonNullable` so values are typed as `string`, not `string | null` — the typed-forms talking point.
- Validators declared in the model, not the template — easier to test and reason about than template-driven `[(ngModel)]`.
- `markAllAsTouched()` so validation messages show when the user submits an empty form.

---

## 7. Detail view + delete (20 min)

Show the animal plus its health records (a second HTTP call), and a delete button that navigates back on success. Reinforces: nested resource fetching, and the `subscribe → navigate` pattern.

---

## 8. Stretch / polish (if time)

- **HTTP interceptor** for centralized error handling or attaching an auth token — the Angular equivalent of ASP.NET middleware. Strong parallel to draw verbally.
- **`async` pipe** somewhere instead of manual subscribe, to show you know it auto-unsubscribes and avoids memory leaks.
- A `signal`-based loading spinner shared via a small state service using `BehaviorSubject` or a writable signal.

---

## End-of-day checklist

- [ ] Standalone components throughout; can explain the no-`NgModule` bootstrap.
- [ ] `provideHttpClient` + `inject(HttpClient)`; service is `providedIn: 'root'`.
- [ ] List view renders from the API; bonus if it uses a signal + `OnPush`.
- [ ] Routing across list / detail / new / edit with the param-order gotcha handled.
- [ ] One reactive form doing both create and edit with validators.
- [ ] Can articulate signals-complement-RxJS and the `switchMap`/`mergeMap`/`concatMap` distinction.

**If you only half-finish:** a list + working reactive form you can fully explain beats a sprawling app you can't. Be able to narrate every design decision — that's what the interview actually tests.
