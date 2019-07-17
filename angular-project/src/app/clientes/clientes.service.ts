import { Injectable } from '@angular/core';
//import { Cliente, Grupo } from './cliente.model';
import { Cliente } from './cliente.model';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';


@Injectable()
export class ClientesService {

  private clientes: Cliente[];
  private clientes$: Subject<Cliente[]> = new Subject<Cliente[]>();

  constructor() {
    this.clientes = [];
  }


  getClientes$(): Observable<Cliente[]> {
    return this.clientes$.asObservable();
  }

  agregarCliente(cliente: Cliente) {
    this.clientes.push(cliente);
    this.clientes$.next(this.clientes);
  }

  nuevoCliente(): Cliente {
    return {
      id: this.clientes.length,
      nombre: '',
      cif: '',
      direccion: '',
      telefono: ''
    };
  }

  borrarCliente(cliente: Cliente): void {
    for (let i = 0; i < this.clientes.length; i++) {
      if (cliente === this.clientes[i]) {
        this.clientes.splice(i, 1);
        break;
      }
    }
  }
}
