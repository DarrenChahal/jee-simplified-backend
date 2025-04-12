import { validateTemplate } from '../validators/templateValidator.js';
import database from '../services/database.js';

export const templateController = {
    createTemplate: async (req, res) => {
        try {
            const templateData = req.body;
            
            // Remove any timestamp information from frontend
            delete templateData.createdAt;
            delete templateData.updatedAt;

            // Validate the incoming data
            const validation = validateTemplate(templateData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Template validation failed',
                    errors: validation.errors
                });
            }

            // Store template in database
            const createdTemplate = await database.createTemplate(validation.data);
            
            return res.status(201).json({
                success: true,
                message: 'Template created successfully',
                templateId: createdTemplate._id
            });
        } catch (error) {
            console.error('Error in createTemplate controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create template',
                error: error.message
            });
        }
    },

    getAllTemplates: async (req, res) => {
        try {
            // Get filters from query params if any
            const filters = req.query;
            
            // Fetch templates with optional filters
            const result = await database.listTemplates(filters);
            
            return res.status(200).json({
                success: true,
                templates: result.documents || []
            });
        } catch (error) {
            console.error('Error in getAllTemplates controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch templates',
                error: error.message
            });
        }
    },

    getTemplateById: async (req, res) => {
        try {
            const templateId = req.params.id;
            
            try {
                const template = await database.getTemplateById(templateId);
                
                return res.status(200).json({
                    success: true,
                    template
                });
            } catch (error) {
                if (error.message === 'Template not found') {
                    return res.status(404).json({
                        success: false,
                        message: 'Template not found'
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error in getTemplateById controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch template',
                error: error.message
            });
        }
    },
    
    updateTemplate: async (req, res) => {
        try {
            const templateId = req.params.id;
            const templateData = req.body;
            
            // Remove any timestamp information from frontend
            delete templateData.createdAt;
            delete templateData.updatedAt;
            
            try {
                // First check if the template exists
                await database.getTemplateById(templateId);
                
                // Validate the incoming data
                const validation = validateTemplate(templateData);
                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Template validation failed',
                        errors: validation.errors
                    });
                }
                
                // Update template in database
                const updatedTemplate = await database.updateTemplate(templateId, validation.data);
                
                return res.status(200).json({
                    success: true,
                    message: 'Template updated successfully',
                    template: updatedTemplate
                });
            } catch (error) {
                if (error.message === 'Template not found') {
                    return res.status(404).json({
                        success: false,
                        message: 'Template not found'
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error in updateTemplate controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update template',
                error: error.message
            });
        }
    },

    deleteTemplate: async (req, res) => {
        try {
            const templateId = req.params.id;
            
            try {
                // First check if the template exists
                await database.getTemplateById(templateId);
                
                // Delete the template
                await database.deleteTemplate(templateId);
                
                return res.status(200).json({
                    success: true,
                    message: 'Template deleted successfully'
                });
            } catch (error) {
                if (error.message === 'Template not found') {
                    return res.status(404).json({
                        success: false,
                        message: 'Template not found'
                    });
                }
                throw error;
            }
        } catch (error) {
            console.error('Error in deleteTemplate controller:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete template',
                error: error.message
            });
        }
    }
}