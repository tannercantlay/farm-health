// farms/farm-form/farm-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { FarmService } from '../../services/farm.service';

@Component({
  selector: 'app-farm-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './farm-form.component.html',
})
export class FarmFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(FarmService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editId?: number;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    location: [''],
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId = Number(id);
      this.service.getById(this.editId).subscribe(f => this.form.patchValue(f));
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const dto = this.form.getRawValue();
    const op: Observable<unknown> = this.editId
      ? this.service.update(this.editId, dto)
      : this.service.create(dto);
    op.subscribe(() => this.router.navigate(['/farms']));
  }
}
