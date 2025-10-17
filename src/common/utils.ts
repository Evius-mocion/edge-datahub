// ...existing code...
 export function generate_code_by_email(email: string): string {
    

    // djb2 hash algorithm (deterministic)
    let hash = 5381;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) + hash) + email.charCodeAt(i); // hash * 33 + c
      hash = hash | 0; // keep as 32-bit integer
    }

    const codeNum = Math.abs(hash) % 100000;
    return codeNum.toString().padStart(5, '0');
  }