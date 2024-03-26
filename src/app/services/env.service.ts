import { Injectable } from '@angular/core';
import { Environment } from '@type/Environment';

@Injectable({
  providedIn: 'root'
})
export class EnvService {
  private _env!: Environment;

  get env(): Environment {
    return this._env;
  }

  init(env: Environment): void {
    this._env = env;
  }
}
