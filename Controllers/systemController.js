export const systemController = {
    getTime: (req, res) => {
        res.json({ time: Date.now() });
    }
};