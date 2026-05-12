'use strict';

const { SiteContent } = require('../models');

const sanitizePageKey = (value) => String(value || '').trim().toLowerCase();

const getSiteContent = async (req, res) => {
  try {
    const pageKey = sanitizePageKey(req.params.pageKey);
    const record = await SiteContent.findOne({ where: { page_key: pageKey } });

    return res.status(200).json({
      success: true,
      data: record || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch site content',
      errors: [error.message],
    });
  }
};

const upsertSiteContent = async (req, res) => {
  try {
    const pageKey = sanitizePageKey(req.params.pageKey);

    if (!pageKey) {
      return res.status(400).json({
        success: false,
        message: 'Page key is required',
      });
    }

    const [record] = await SiteContent.upsert(
      {
        page_key: pageKey,
        content: req.body?.content || {},
      },
      { returning: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Site content saved successfully',
      data: record,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to save site content',
      errors: error.errors ? error.errors.map((err) => err.message) : [error.message],
    });
  }
};

module.exports = {
  getSiteContent,
  upsertSiteContent,
};
