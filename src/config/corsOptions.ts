const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

const corsOptions = {
  origin: (
    origin: string,
    callback: (_arg0: Error | null, _arg1?: boolean | undefined) => void
  ) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("not allowed by cors"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;
