exports.handler = async () => {
  return {
    statusCode: 501,
    body: JSON.stringify({ error: "not implemented - placeholder deployment package" }),
  };
};
