export interface HealthRecord { id: number; recordedAt: string; status: string; notes?: string; animalId: number; }
export interface CreateHealthRecord { status: string; notes?: string; animalId: number; }
export interface UpdateHealthRecord { status: string; notes?: string; }
