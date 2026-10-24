"""Regression checks for public model configuration and credential scanning."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import scan_secrets


class EnvValuesTest(unittest.TestCase):
    def values(self, contents):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / ".env.local"
            path.write_text(contents)
            with patch.object(scan_secrets, "ENV_LOCAL", path):
                return scan_secrets.env_local_values()

    def test_public_model_configuration_is_not_a_secret(self):
        self.assertEqual(self.values(
            'MODEL_PROVIDER="gateway"\nMODEL_ID=openai/gpt-4.1-mini\n'
        ), [])

    def test_keys_and_unknown_model_values_remain_protected(self):
        fake_key = "connectivity-test-credential"
        self.assertEqual(self.values(
            f"AI_GATEWAY_API_KEY={fake_key}\nMODEL_ID={fake_key}\n"
        ), [fake_key, fake_key])

    def test_public_value_exemption_does_not_apply_to_secret_variables(self):
        self.assertEqual(self.values("AI_GATEWAY_API_KEY=openai/gpt-4.1-mini\n"),
                         ["openai/gpt-4.1-mini"])

    def test_leaked_local_credential_is_still_reported_without_its_value(self):
        fake_key = "connectivity-test-credential"
        with patch.object(scan_secrets, "env_local_values", return_value=[fake_key]), \
             patch.object(scan_secrets, "files_to_scan", return_value=["example.txt"]), \
             patch.object(scan_secrets, "read", return_value=fake_key):
            findings = scan_secrets.scan(staged=True)
        self.assertEqual(findings, ["example.txt:1: value from .env.local"])
        self.assertNotIn(fake_key, str(findings))


if __name__ == "__main__":
    unittest.main()
