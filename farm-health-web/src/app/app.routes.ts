import { Routes } from '@angular/router';
import { AnimalListComponent } from './animals/animal-list/animal-list.component';
import { AnimalDetailComponent } from './animals/animal-detail/animal-detail.component';
import { AnimalFormComponent } from './animals/animal-form/animal-form.component';
import { FarmListComponent } from './farms/farm-list/farm-list.component';
import { FarmFormComponent } from './farms/farm-form/farm-form.component';
import { HealthRecordFormComponent } from './health-records/health-record-form/health-record-form.component';
import { SickAnimalsComponent } from './sick-animals/sick-animals.component';

export const routes: Routes = [
  { path: '', redirectTo: 'farms', pathMatch: 'full' },
  { path: 'sick', component: SickAnimalsComponent },

  // Farms
  { path: 'farms', component: FarmListComponent },
  { path: 'farms/new', component: FarmFormComponent },
  { path: 'farms/:id/edit', component: FarmFormComponent },

  // Animals
  { path: 'animals', component: AnimalListComponent },
  { path: 'animals/new', component: AnimalFormComponent },
  { path: 'animals/:id', component: AnimalDetailComponent },
  { path: 'animals/:id/edit', component: AnimalFormComponent },

  // Health Records
  { path: 'animals/:animalId/healthrecords/new', component: HealthRecordFormComponent },
];
