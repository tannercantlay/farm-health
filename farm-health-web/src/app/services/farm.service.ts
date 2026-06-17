// services/farm.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Farm, CreateFarm, UpdateFarm } from '../models/farm';

@Injectable({ providedIn: 'root' })
export class FarmService {
  private http = inject(HttpClient);
  private readonly base = '/api/farms';

  getAll(): Observable<Farm[]> {
    return this.http.get<Farm[]>(this.base);
  }
  getById(id: number): Observable<Farm> {
    return this.http.get<Farm>(`${this.base}/${id}`);
  }
  create(dto: CreateFarm): Observable<Farm> {
    return this.http.post<Farm>(this.base, dto);
  }
  update(id: number, dto: UpdateFarm): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
