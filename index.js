/*
 * index.js
 *
 * Ponto de entrada do app (é o arquivo indicado em "main" no package.json).
 * `registerRootComponent` registra o componente App para rodar tanto no
 * Expo Go (celular) quanto no navegador. Não precisa mexer aqui.
 */
import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
