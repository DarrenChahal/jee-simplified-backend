import jobs from '../jobs/index.js';

export const cronController = {
    /**
     * Synchronizes test status (activates scheduled tests and completes finished tests)
     * Designed to be called by a cron job (e.g., Google Cloud Scheduler)
     */
    syncTestStatus: async (req, res) => {
        try {
            console.log('Cron Job: Synchronizing test status...');
            
            // Run both jobs in parallel
            const [activationStats, completionStats] = await Promise.all([
                jobs.activateScheduledTests(),
                jobs.completeFinishedTests()
            ]);

            // Process newly completed tests through the pipeline
            let processingStats = null;
            if (completionStats.completedTestIds && completionStats.completedTestIds.length > 0) {
                console.log(`Cron Job: Processing ${completionStats.completedTestIds.length} completed test(s)...`);
                processingStats = await jobs.processCompletedTests(completionStats.completedTestIds);
            }

            const totalActivated = activationStats.activatedCount;
            const totalCompleted = completionStats.completedCount;
            const totalProcessed = processingStats ? processingStats.successful.length : 0;
            const errors = [
                ...activationStats.errors, 
                ...completionStats.errors,
                ...(processingStats ? processingStats.failed : [])
            ];

            const message = `Job completed. Activated: ${totalActivated}, Completed: ${totalCompleted}, Processed: ${totalProcessed}.`;
            console.log(message);

            return res.status(200).json({
                success: true,
                message,
                stats: {
                    activation: activationStats,
                    completion: completionStats,
                    processing: processingStats
                },
                errors: errors.length > 0 ? errors : undefined
            });

        } catch (error) {
            console.error('Error in syncTestStatus cron job:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during cron job',
                error: error.message
            });
        }
    },




};
