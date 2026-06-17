// animals/animal-detail/animal-detail.component.ts
import { Component, computed, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnimalService } from '../../services/animal.service';
import { FarmService } from '../../services/farm.service';
import { HealthRecordService } from '../../services/health-record.service';
import { Farm } from '../../models/farm';

@Component({
  selector: 'app-animal-detail',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './animal-detail.component.html',
})
export class AnimalDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private animalService = inject(AnimalService);
  private farmService = inject(FarmService);
  private healthService = inject(HealthRecordService);

  // switchMap: when :id changes, cancel in-flight request and fetch the new animal
  animal = toSignal(
    this.route.paramMap.pipe(
      switchMap(p => this.animalService.getById(Number(p.get('id'))))
    )
  );

  farms = toSignal(this.farmService.getAll(), { initialValue: [] as Farm[] });

  farmName = computed(() => {
    const animal = this.animal();
    if (!animal) return null;
    return this.farms().find(f => f.id === animal.farmId)?.name ?? `Farm #${animal.farmId}`;
  });

  healthRecords = toSignal(
    this.route.paramMap.pipe(
      switchMap(p => this.healthService.getByAnimalId(Number(p.get('id'))))
    ),
    { initialValue: [] }
  );

  delete() {
    const id = this.animal()?.id;
    if (!id) return;
    this.animalService.delete(id).subscribe(() => this.router.navigate(['/animals']));
  }
}
