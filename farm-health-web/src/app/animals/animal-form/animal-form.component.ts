// animals/animal-form/animal-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnimalService } from '../../services/animal.service';
import { FarmService } from '../../services/farm.service';
import { Farm } from '../../models/farm';

@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './animal-form.component.html',
})
export class AnimalFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(AnimalService);
  private farmService = inject(FarmService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editId?: number;
  farms = toSignal(this.farmService.getAll(), { initialValue: [] as Farm[] });

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    species: ['', Validators.required],
    farmId: [0, Validators.required],
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
    const op: Observable<unknown> = this.editId
      ? this.service.update(this.editId, dto)
      : this.service.create(dto);
    op.subscribe(() => this.router.navigate(['/animals']));
  }
}
