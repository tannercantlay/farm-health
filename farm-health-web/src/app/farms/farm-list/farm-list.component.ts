// farms/farm-list/farm-list.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FarmService } from '../../services/farm.service';
import { Farm } from '../../models/farm';

@Component({
  selector: 'app-farm-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './farm-list.component.html',
})
export class FarmListComponent {
  private service = inject(FarmService);
  farms = toSignal(this.service.getAll(), { initialValue: [] as Farm[] });
}
