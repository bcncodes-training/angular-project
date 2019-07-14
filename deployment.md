# Deployment | Despliegue de la aplicación

## Workflow

El _deployment_ o despliegue de la aplicación consiste en llevar la aplicación de nuestro servidor de desarrollo a un servidor remoto.

El proceso de despliegue de una aplicación siempre debería seguir siempre el siguiente flujo de trabajo: Desarrollo (*development*), Pre-producción (*staging*) y Producción (*production*).

- **Desarrollo** es el entorno donde el desarrollador prueba el trabajo de forma local. En el caso de aplicaciones grandes se utilizarán servidores remotos del tipo Heroku. Este es un entorno de pruebas aislado (*sandbox*) que se puede utilizar para hacer modificaciones que no tendrán repercusiones serias.
- **Preproducción** - o entorno de pruebas, es un entorno que copia al entorno de producción real. Podemos utilizar servidores remotos tales como Heroku, Azure o AWS. Este entorno servirá para detectar cualquier deficiencia antes de desplegar en producción.
- **Production** - Este es el entorno real, el alojamiento web que verán los usuarios.

![](https://imgur.com/znUyLkY.png)


**Estrategia de despliegue:**

- Los desarrolladores trabajan en los defectos (_bugs_) o nuevas funcionalidades (_features_) en ramas git separadas. Cualquier actualización que ocurra durante este proceso, se podrá añadir directamente a la rama de desarrollo estable.

- Una vez que se han implementado las nuevas funcionalidades, se fusionan con la rama de preproducción de las mismas y se despliega la aplicación en el entorno preproductivo para asegurar la calidad y hacer las pruebas necesarias.
- Después de completar las pruebas, las ramas de nuevas funcionalidades se fusionan con la rama de desarrollo.
- En el momento del pase a producción (*release date*), la rama de desarrollo se fusionará con la de producción para su despliegue en el entorno de producción.


## Preparando la aplicación: ENVIRONMENTS

En el directorio `environments/` se encuentra el fichero `environment.ts` que provee la configuración por defecto de la aplicación. En este directorio añadiremos las configuraciones para los distintos entornos: desarrollo, preproducción y producción:

└──myProject/src/environments/
                   └──environment.ts
                   └──environment.prod.ts
                   └──environment.staging.ts

Dentro del fichero `angular.json` en el apartado `"configurations"` definiremos los cambios entre la versión por defecto y la versión compilada:

```json
"configurations": {
  "production": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod.ts"
      }
    ],
    ...
```
Si tenemos entorno de preproducción añadiremos un elemento más con el nombre `"staging:"` y el contenido a  modificar: 
```ts

"configurations": {
  "production": { ... },
  "staging": {
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.staging.ts"
      }
    ]
  }
}
```
Para compilar la aplicación con una u otra configuración ejecutaremos el comando:

Para producción:

`ng build --prod` ó 
`ng build --configuration=production`

Para preproducción:

`ng build --configuration=staging`


Modificaremos los ficheros de entorno para indicar a la aplicación dónde van a estar nuestras API's. En general, estableceremos dos rutas: una para desarrollo y otra para producción. Lo que haremos es indicarle a la aplicación cuales son las rutas "base" de las APIS's. Por ejemplo, supongamos el caso de que tenemos las tres siguientes:

`http://http://localhost:3000/clientes`
`http://http://localhost:3000/users`
`http://http://localhost:3000/login`

La ruta base (es decir, la parte "común") sería `http://localhost/:3000/`.

Ahora supongamos que tenemos previsto que, cuando pasemos a producción, las API's van a ser las siguientes:

`https://mi-crud-prueba.herokuapp.com/clientes`
`https://mi-crud-prueba.herokuapp.com/users`
`https://mi-crud-prueba.herokuapp.com/login`

La ruta base para producción sería `https://mi-crud-prueba.herokuapp.com/`.

Las dos partes comunes se las tenemos que indicar a la aplicación dentro de los ficheros de environments, que acabamos de ver:

```js
└──myProject/src/environments/
                   └──environment.ts
                   └──environment.prod.ts
```

En principio, el primero tiene el siguiente código:

```ts
export const environment = {
   production: false
 };
```

Y el segundo tiene algo parecido, con una diferencia interesante:

```ts
export const environment = {
   production: true
 };

```

Como ves, en el de desarrollo la variable `production` vale **false**, mientras que en el de producción esta variable vale **true**. Esta variable es empleada por Angular para seleccionar un fichero u otro, dependiendo de si estamos ejecutando nuestra aplicación en desarrollo, o la versión distribuible (compilada). Vamos a modificar estos ficheros. El de desarrollo quedará así:

```ts
export const environment = {
   production: false,
   API_URL: 'http://localhost:3000/'
 };
```

El de producción, por su parte, quedará así:

```ts
export const environment = {
   production: true,
   API_URL: 'https://mi-crud-prueba.herokuapp.com/'
 };

```

Angular elegirá, de forma transparente a nosotros, el archivo que corresponda al modo en que estemos trabajando (desarrollo o producción), en la variable `API_URL` siempre tendremos la ruta base adecuada para que la aplicación localice la raíz de nuestras API's. Esta variable puede llamarse como deseemos. 

Una vez declarada la variable con la ruta base de las API's, necesitamos referenciarla dentro del servicio donde se realizan las llamadas a las API. En nuestro caso de ejemplo: **api.service.ts** y **auth.service.ts**. Para ello, importaremos la propiedad **environment** en cada uno de los archivos y declararemos una variable para trabajar con la ruta raíz de las API's:

**api.service.ts**:

```ts
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiURL = `${environment.API_URL}clientes`;
  constructor(private http: HttpClient) { }

  getMembers$() {
    return this.http.get(this.apiURL);
  }

  getMember$(id: string) {
    this.apiURL +=id;
    return this.http.get<Member>(this.apiURL);
  }
```

**auth.service.ts**:

```ts
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth_url = environment.API_URL;
  isLogged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.getLogged());


  constructor(private http: HttpClient) {}
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  registerUser(name: string, email: string, password: string) {

    this.auth_url += 'register';
    return this.http
      .post<UserInterface>(
        this.auth_url,
        {
          name,
          email,
          password
        },
        { headers: this.headers }
      )
      .pipe(tap(data => data),
      catchError(error => {console.log(error);
                           return throwError(error); }));
  }

```

## Compilando la aplicación

- Para comprobar como se comportará nuestra aplicación una vez compilada, debemos hacer algunas modificaciones:

- En el fichero `package.json`

Modificaremos la propiedad `build` para añadir la compilación --aot y la referencia a la línea base de la aplicación:

```script
"scripts": {
...
   "build": "ng build --aot --base-href ./",
...
```

⚠️:: Si después de compilar la aplicación volvemos a ejecutar npm start, el directorio `/dist` se borrará. Angular asume que si vuelves a trabajar en la versión de desarrollo volverás a crear una nueva versión de producción.


- Si queremos ver que resultado tendrá la aplicación una vez compilada. Comenzaremos lanzando el comando:

`npm run build`

Esto regenerará el directorio de salida de ficheros (normalmente `/dist`)

Este directorio podemos traspasarlo a la carpeta `htdocs` de **[XAMPP](https://www.apachefriends.org/es/index.html)** o ejecutarlo directamente desde otro terminal con un servidor node tal como **[LITE-SERVER](https://github.com/johnpapa/lite-server)**: 

`lite-server --baseDir="dist"`

:warning: Prestar atención a las [CSP](https://developer.mozilla.org/es/docs/Web/HTTP/CSP) que pueden bloquear el contenido. En algunos casos en los que se quieran importar librerías (ejemplo [google](https://fonts.googleapis.com)) de tercero, habrá que permitir su instalación mediante la activación de las políticas de contenido (Content Security Policy):

```html
 <meta http-equiv="Content-Security-Policy" content="default-src 'self' *; style-src * 'unsafe-inline'">
 ```

Para generar la aplicación de producción añadiremos a la propiedad `build` el modificador: `--prod`: 

Quedando:

"build": "ng build --prod --base-href ./",

El modificador --prod es lo que asegura que la compilación de tu aplicación para distribuir se ejecute en modo producción, en lugar de en modo desarrollo. Optimiza el número de ficheros, y el tiempo de ejecución y aplica los parámetros del fichero environment.prod.ts.

## Despliegue de una aplicación Angular

Según el tipo de aplicación que tengamos, existen diferentes servicios de hospedaje. Por ejemplo, una aplicación cliente, como por ejemplo un álbum de imágenes, no necesitará un tipo de *backend* especial. Sólo necesitará un servidor que hospede ficheros estáticos.

<div style="margin: 50px auto; min-height: 100px;">

<img style="float: left;" src="https://s3-eu-west-1.amazonaws.com/ih-materials/uploads/upload_f861c1f3073e13eafd52ad1704427e25.png">

</div>

En el caso de que queramos desplegar la aplicación sin el *backend* también podemos utilizar la opción de [Github pages](https://pages.github.com/), que permite subir código directamente usando un repositorio de git. 

El cliente `Angular-cli` tiene una instrucción para desplegar directamente la aplicación a una [gh-pages](https://github.com/angular-schule/angular-cli-ghpages).

Aquí lo haremos sin utilizar el cliente `angular-CLI`.

- Lo primero que haremos sera crear un repositorio  para el proyecto, en GitHub.
- Acto seguido generaremos la versión de producción con el comando siguiente:

`ng build --prod --output-path docs --base-href /./`

- Cuando se haya completado el proceso haremos una copia de `docs/index.html` y lo renombraremos como `docs/404.html`.

- Haremos commit de los cambios y push:
- En la página de `settings` de GitHub configuraremos para publicar el proyecto desde la carpeta `/docs`(2ª opción).
- El proyecto se desplegará en: 
`https://<user_name>.github.io/<project_name>/
`

<div style="margin: 50px auto; min-height: 100px;">


<img style="float: left" width="350" src="https://s3-eu-west-1.amazonaws.com/ih-materials/uploads/upload_788898ea19304c521e348bc2755db363.png">

</div>

En el caso de aplicaciones más complejas, necesitamos exponer nuestra propia API. Github pages no permite realizar cambios en el `backend` (no es el propósito de la plataforma) así que necesitamos un servicio diferente, usaremos [Heroku](https://www.heroku.com/).

#### Prerequisitos

Necesitamos:

- Una cuenta de Heroku
- El cliente [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalado

## Desplegando la API en Heroku

![](https://s3-eu-west-1.amazonaws.com/ih-materials/uploads/upload_c6234ee95f4599da6df0b1290ac8769c.png)


### 1. Modificamos la API

- Clonar el proyecto: `https://github.com/bcncodes-training/json-server-heroku.git`

- Modificar el contenido del fichero `db.json` por el vuestro.


### 2. Subiendo la API al servidor

- Desde un terminal, **dentro del directorio de la api**, tecleamos:
  ```
  $  heroku login
  ```
- Ahora le damos el nombre que queramos al proyecto:
  ```
  $ heroku create mi-crud-api
  ```
- Subimos el código a Heroku:
  ```
  $ git push heroku master
  ```
- Podemos probar la API tecleando:
  ```
  $ heroku open
  ```

- Modificar el fichero `environment.prod.ts` de la aplicación Angular para incorporar la URL base de las APIs de producción.

## Desplegando la aplicación Angular en 

![](https://www.cdmon.com/images/logo_cdmon_retina_3.png)

#### Daremos de alta una plataforma de pruebas:

Una vez registrados daremos de alta un nuevo servicio => Hosting => Plataforma de pruebas:

![](https://imgur.com/jlHA6Tw.png)



#### Compilar la versión de producción de la aplicación

Ejecutaremos desde el terminal:

`ng build --prod --base-href ./`

#### Generar dist.zip 
A partir del directorio `/dist` de la aplicación.

#### FTP al servidor

Desde la plataforma de prueba del servidor CDMON seleccionaremos FTP en Gestores de Archivo y el fichero comprimido anterior.

#### Mover a la carpeta /web
Descomprimir el fichero y mover el contenido a la carpeta `/web`.
