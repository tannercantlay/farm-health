// services/animal.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Animal, CreateAnimal, UpdateAnimal } from '../models/animals';

@Injectable({ providedIn: 'root' })
export class AnimalService {
  private http = inject(HttpClient);
  private readonly base = '/api/animals';

  getAll(): Observable<Animal[]> {
    return this.http.get<Animal[]>(this.base);
  }
  getById(id: number): Observable<Animal> {
    return this.http.get<Animal>(`${this.base}/${id}`);
  }
  create(dto: CreateAnimal): Observable<Animal> {
    return this.http.post<Animal>(this.base, dto);
  }
  update(id: number, dto: UpdateAnimal): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, dto);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}