"use strict";

export const getHealth = async (req, res) => {
  res.status(200).json({ ok: true, db: "up" });
};

