// sick-animals/sick-animals.component.ts
import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnimalService } from '../services/animal.service';
import { FarmService } from '../services/farm.service';
import { HealthRecordService } from '../services/health-record.service';
import { Animal } from '../models/animals';
import { Farm } from '../models/farm';
import { HealthRecord } from '../models/healthrecord';

interface SickAnimal {
  animal: Animal;
  latestRecord: HealthRecord;
}

@Component({
  selector: 'app-sick-animals',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sick-animals.component.html',
})
export class SickAnimalsComponent implements OnInit {
  private animalService = inject(AnimalService);
  private farmService = inject(FarmService);
  private healthService = inject(HealthRecordService);

  farms = toSignal(this.farmService.getAll(), { initialValue: [] as Farm[] });
  loading = signal(true);
  sickAnimals = signal<SickAnimal[]>([]);

  // group sick animals by farm
  farmGroups = computed(() => {
    const farms = this.farms();
    const sick = this.sickAnimals();
    return farms
      .map(farm => ({
        farm,
        animals: sick.filter(s => s.animal.farmId === farm.id),
      }))
      .filter(g => g.animals.length > 0); // only show farms that have sick animals
  });

  ngOnInit() {
    this.animalService.getAll().pipe(
      switchMap(animals => {
        if (animals.length === 0) return of([]);
        // fetch health records for all animals in parallel
        return forkJoin(
          animals.map(animal =>
            this.healthService.getByAnimalId(animal.id).pipe(
              // pair each animal with its records
              switchMap(records => of({ animal, records }))
            )
          )
        );
      })
    ).subscribe(results => {
      const sick: SickAnimal[] = [];
      for (const { animal, records } of results) {
        if (records.length === 0) continue;
        // sort by date descending to get the most recent record
        const sorted = [...records].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
        );
        if (sorted[0].status === 'Sick') {
          sick.push({ animal, latestRecord: sorted[0] });
        }
      }
      this.sickAnimals.set(sick);
      this.loading.set(false);
    });
  }
}
