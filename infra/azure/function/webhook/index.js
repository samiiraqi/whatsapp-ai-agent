module.exports = async function (context, req) {
  context.res = {
    status: 501,
    body: { error: "not implemented - placeholder deployment package" },
  };
};
