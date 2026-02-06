export default function LoginPage() {
  return (
    <div className="max-w-sm mx-auto card p-4">
      <h2 className="page-title mb-3">Login</h2>
      <input className="input w-full mb-2" placeholder="admin@pixecom.local" />
      <input className="input w-full mb-3" placeholder="password" type="password" />
      <button className="btn btn-primary">Login</button>
    </div>
  );
}
