const goalsService = require('../services/goalsService');

exports.getGoals = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, error: 'User ID required' });
    const goals = await goalsService.getGoals(user_id);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const { user_id, name, amount, currentSavings, date } = req.body;
    if (!user_id || !name || !amount) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }
    const newGoal = await goalsService.createGoal(user_id, { name, amount, currentSavings, date });
    res.json({ success: true, data: newGoal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params; 
    const { user_id, ...updates } = req.body; 
    const updatedGoal = await goalsService.updateGoal(id, user_id, updates);
    if (!updatedGoal) return res.status(404).json({ success: false, error: 'Goal not found' });
    res.json({ success: true, data: updatedGoal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body; 
    const success = await goalsService.deleteGoal(id, user_id);
    if (!success) return res.status(404).json({ success: false, error: 'Goal not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};