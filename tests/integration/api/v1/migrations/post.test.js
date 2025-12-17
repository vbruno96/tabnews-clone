test("POST to /api/v1/migrations should 201", async () => {
  const response1 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  const response1Body = await response1.json();

  expect(response1.status).toBe(201);
  expect(response1Body.length).toBeGreaterThan(0);

  const response2 = await fetch("http://localhost:3000/api/v1/migrations", {
    method: "POST",
  });
  const response2Body = await response2.json();

  expect(response2.status).toBe(200);
  expect(response2Body.length).toBe(0);
});
