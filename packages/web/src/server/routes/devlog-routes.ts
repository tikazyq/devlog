import { Router } from 'express';
import { DevlogManager } from '@devlog/core';
import { CreateDevlogRequest, UpdateDevlogRequest, DevlogFilter } from '@devlog/types';

export function devlogRoutes(devlogManager: DevlogManager): Router {
  const router = Router();

  // Get all devlogs
  router.get('/', async (req, res) => {
    try {
      const filter: DevlogFilter = {};
      
      // Parse query parameters
      if (req.query.status) filter.status = req.query.status as any;
      if (req.query.type) filter.type = req.query.type as any;
      if (req.query.priority) filter.priority = req.query.priority as any;

      const devlogs = await devlogManager.listDevlogs(filter);
      res.json(devlogs);
    } catch (error) {
      console.error('Error fetching devlogs:', error);
      res.status(500).json({ error: 'Failed to fetch devlogs' });
    }
  });

  // Get devlog by ID
  router.get('/:id', async (req, res) => {
    try {
      const devlog = await devlogManager.getDevlog(req.params.id);
      if (!devlog) {
        return res.status(404).json({ error: 'Devlog not found' });
      }
      return res.json(devlog);
    } catch (error) {
      console.error('Error fetching devlog:', error);
      return res.status(500).json({ error: 'Failed to fetch devlog' });
    }
  });

  // Create new devlog
  router.post('/', async (req, res) => {
    try {
      const request: CreateDevlogRequest = req.body;
      const devlog = await devlogManager.findOrCreateDevlog(request);
      res.status(201).json(devlog);
    } catch (error) {
      console.error('Error creating devlog:', error);
      res.status(500).json({ error: 'Failed to create devlog' });
    }
  });

  // Update devlog
  router.put('/:id', async (req, res) => {
    try {
      const request: UpdateDevlogRequest = { id: req.params.id, ...req.body };
      const devlog = await devlogManager.updateDevlog(request);
      res.json(devlog);
    } catch (error) {
      console.error('Error updating devlog:', error);
      res.status(500).json({ error: 'Failed to update devlog' });
    }
  });

  // Delete devlog
  router.delete('/:id', async (req, res) => {
    try {
      await devlogManager.deleteDevlog(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting devlog:', error);
      res.status(500).json({ error: 'Failed to delete devlog' });
    }
  });

  // Add note to devlog
  router.post('/:id/notes', async (req, res) => {
    try {
      const { note } = req.body;
      const devlog = await devlogManager.addNote(req.params.id, note);
      res.json(devlog);
    } catch (error) {
      console.error('Error adding note:', error);
      res.status(500).json({ error: 'Failed to add note' });
    }
  });

  // Get devlog stats
  router.get('/stats/overview', async (req, res) => {
    try {
      const stats = await devlogManager.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Search devlogs
  router.get('/search/:query', async (req, res) => {
    try {
      const results = await devlogManager.searchDevlogs(req.params.query);
      res.json(results);
    } catch (error) {
      console.error('Error searching devlogs:', error);
      res.status(500).json({ error: 'Failed to search devlogs' });
    }
  });

  return router;
}
