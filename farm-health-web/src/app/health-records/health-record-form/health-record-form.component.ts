// health-records/health-record-form/health-record-form.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HealthRecordService } from '../../services/health-record.service';

@Component({
  selector: 'app-health-record-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './health-record-form.component.html',
})
export class HealthRecordFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(HealthRecordService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  animalId!: number;

  form = this.fb.nonNullable.group({
    status: ['Healthy', Validators.required],
    notes: [''],
  });

  ngOnInit() {
    this.animalId = Number(this.route.snapshot.paramMap.get('animalId'));
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { status, notes } = this.form.getRawValue();
    this.service.create(this.animalId, { status, notes: notes || undefined, animalId: this.animalId })
      .subscribe(() => this.router.navigate(['/animals', this.animalId]));
  }
}
