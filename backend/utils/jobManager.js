const jobManager = {
  jobs: new Map(),

  register(id, process) {
    this.jobs.set(id, process);
  },

  unregister(id) {
    this.jobs.delete(id);
  },

  cancel(id) {
    const process = this.jobs.get(id);
    if (process) {
      // Kill the process and all its children (if possible, though simple kill usually works for exec)
      // tree-kill package is safer for shell commands but let's try standard kill first
      process.kill("SIGTERM");
      this.jobs.delete(id);
      return true;
    }
    return false;
  },
};

module.exports = jobManager;
