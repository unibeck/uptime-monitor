-- Custom SQL migration file, put your code below! --
INSERT INTO endpointMonitors SELECT * FROM websites;
