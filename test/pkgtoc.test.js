const mockConsole = require("jest-mock-console").default;
const { pkgtoc } = require("../src/pkgtoc");

const DEFAULT_OPTIONS = {
  dryRun: true,
  glob: "packages/scripts/pkgtoc/test/fixtures/*"
};

describe("pkgtoc", () => {
  beforeAll(() => mockConsole());

  describe("default", () => {
    it("should match snapshot", async () => {
      const table = await pkgtoc(DEFAULT_OPTIONS);
      expect(table).toMatchSnapshot();
    });
  });

  describe("3 columns", () => {
    it("should match snapshot", async () => {
      const table = await pkgtoc({ ...DEFAULT_OPTIONS, columns: 3 });
      expect(table).toMatchSnapshot();
    });

    it("should match snapshot w/ shields", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 3,
        shields: true
      });
      expect(table).toMatchSnapshot();
    });
  });

  describe("2 columns", () => {
    it("should match snapshot", async () => {
      const table = await pkgtoc({ ...DEFAULT_OPTIONS, columns: 3 });
      expect(table).toMatchSnapshot();
    });

    it("should match snapshot w/ shields", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 3,
        shields: true
      });
      expect(table).toMatchSnapshot();
    });
  });

  describe("1 columns", () => {
    it("should match snapshot", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 1
      });
      expect(table).toMatchSnapshot();
    });

    it("should match snapshot with shields", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 1,
        shields: true
      });
      expect(table).toMatchSnapshot();
    });
  });

  describe("colors", () => {
    it("should match snapshot", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 1,
        shields: true,
        shieldsColor: "000000"
      });
      expect(table).toMatchSnapshot();
    });

    it("should match snapshot with shields", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 1,
        shields: true,
        shieldsColor: "ff0000"
      });
      expect(table).toMatchSnapshot();
    });

    it("should match snapshot with auto shields", async () => {
      const table = await pkgtoc({
        ...DEFAULT_OPTIONS,
        columns: 1,
        shields: true,
        shieldsColor: "ff0000",
        shieldsAuto: true
      });
      expect(table).toMatchSnapshot();
    });
  });
});
