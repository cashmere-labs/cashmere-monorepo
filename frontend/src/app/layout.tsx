import React from 'react';
import { PageShell } from "../components/PageShell";

const RootLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <html lang="en">
      <body>
          <div id='root'>
            <PageShell>
              {children}
            </PageShell>
          </div>
      </body>
    </html>
  );
};

export default RootLayout;
