// services/health-record.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HealthRecord, CreateHealthRecord, UpdateHealthRecord } from '../models/healthrecord';

@Injectable({ providedIn: 'root' })
export class HealthRecordService {
  private http = inject(HttpClient);

  getByAnimalId(animalId: number): Observable<HealthRecord[]> {
    return this.http.get<HealthRecord[]>(`/api/animals/${animalId}/healthrecords`);
  }
  getById(animalId: number, id: number): Observable<HealthRecord> {
    return this.http.get<HealthRecord>(`/api/animals/${animalId}/healthrecords/${id}`);
  }
  create(animalId: number, dto: CreateHealthRecord): Observable<HealthRecord> {
    return this.http.post<HealthRecord>(`/api/animals/${animalId}/healthrecords`, dto);
  }
  update(animalId: number, id: number, dto: UpdateHealthRecord): Observable<void> {
    return this.http.put<void>(`/api/animals/${animalId}/healthrecords/${id}`, dto);
  }
  delete(animalId: number, id: number): Observable<void> {
    return this.http.delete<void>(`/api/animals/${animalId}/healthrecords/${id}`);
  }
}
