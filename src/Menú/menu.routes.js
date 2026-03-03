import { Router } from 'express';
import { getMenu } from './menu.controller.js';

const api = Router();

api.get('/', getMenu);

export default api;