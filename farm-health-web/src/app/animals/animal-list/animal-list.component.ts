// animals/animal-list/animal-list.component.ts
import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AnimalService } from '../../services/animal.service';
import { FarmService } from '../../services/farm.service';
import { Farm } from '../../models/farm';
import { Animal } from '../../models/animals';

@Component({
  selector: 'app-animal-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './animal-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalListComponent {
  private animalService = inject(AnimalService);
  private farmService = inject(FarmService);

  animals = toSignal(this.animalService.getAll(), { initialValue: [] as Animal[] });
  farms = toSignal(this.farmService.getAll(), { initialValue: [] as Farm[] });

  // group animals under their farm, preserving farm order
  farmGroups = computed(() => {
    const animals = this.animals();
    const farms = this.farms();
    return farms.map(farm => ({
      farm,
      animals: animals.filter(a => a.farmId === farm.id),
    }));
  });

  // animals that have no matching farm (shouldn't happen but safe to handle)
  unassigned = computed(() => {
    const farmIds = new Set(this.farms().map(f => f.id));
    return this.animals().filter(a => !farmIds.has(a.farmId));
  });

  loading = computed(() => this.animals().length === 0 && this.farms().length === 0);
}
