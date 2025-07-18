// src/settings/AuthenticationTokensTab.js

import React, { useState, useEffect } from 'react';
import {
	Card,
	CardBody,
	Button,
	TextareaControl,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { format } from 'date-fns';

const AuthenticationTokensTab = () => {
	const [ token, setToken ] = useState( null );
	const [ tokens, setTokens ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ copySuccess, setCopySuccess ] = useState( false );
	const [ selectedDuration, setSelectedDuration ] = useState( 3600 ); // Default to 1 hour

	// UPDATED: Duration options včetně "never"
	const durationOptions = [
		{ label: __( '1 hour', 'wordpress-mcp' ), value: 3600 },
		{ label: __( '2 hours', 'wordpress-mcp' ), value: 7200 },
		{ label: __( '6 hours', 'wordpress-mcp' ), value: 21600 },
		{ label: __( '12 hours', 'wordpress-mcp' ), value: 43200 },
		{ label: __( '24 hours (1 day)', 'wordpress-mcp' ), value: 86400 },
		{ label: __( '⚠️ Never expire (NOT RECOMMENDED)', 'wordpress-mcp' ), value: 'never' },
	];

	useEffect( () => {
		// Fetch tokens when component mounts
		fetchTokens();
	}, [] );

	// Clear copy success message after 2 seconds
	useEffect( () => {
		if ( copySuccess ) {
			const timer = setTimeout( () => {
				setCopySuccess( false );
			}, 2000 );
			return () => clearTimeout( timer );
		}
	}, [ copySuccess ] );

	const fetchTokens = async () => {
		try {
			const response = await apiFetch( {
				path: '/jwt-auth/v1/tokens',
				method: 'GET',
				includeCredentials: true,
			} );
			setTokens( response );
		} catch ( err ) {
			setError( __( 'Error fetching tokens', 'wordpress-mcp' ) );
		}
	};

	// UPDATED: Generate token s podporou "never"
	const generateToken = async () => {
		setLoading( true );
		setError( null );

		try {
			const response = await apiFetch( {
				path: '/jwt-auth/v1/token',
				method: 'POST',
				data: {
					expires_in: selectedDuration,
				},
				includeCredentials: true,
			} );

			setToken( response );
			// Refresh the tokens list
			fetchTokens();
		} catch ( err ) {
			setError(
				err.message || __( 'Error generating token', 'wordpress-mcp' )
			);
		} finally {
			setLoading( false );
		}
	};

	const revokeToken = async ( jti ) => {
		try {
			await apiFetch( {
				path: '/jwt-auth/v1/revoke',
				method: 'POST',
				data: {
					jti: jti,
				},
				includeCredentials: true,
			} );
			// Refresh the tokens list
			fetchTokens();
		} catch ( err ) {
			setError(
				err.message || __( 'Error revoking token', 'wordpress-mcp' )
			);
		}
	};

	const copyToClipboard = ( text ) => {
		// Try using the Clipboard API first
		if ( navigator.clipboard && window.isSecureContext ) {
			navigator.clipboard.writeText( text ).then(
				() => {
					setCopySuccess( true );
				},
				() => {
					// Fallback if Clipboard API fails
					fallbackCopyToClipboard( text );
				}
			);
		} else {
			// Fallback for non-secure contexts or when Clipboard API is not available
			fallbackCopyToClipboard( text );
		}
	};

	const fallbackCopyToClipboard = ( text ) => {
		// Create a temporary textarea element
		const textArea = document.createElement( 'textarea' );
		textArea.value = text;

		// Make the textarea out of viewport
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild( textArea );

		// Select and copy the text
		textArea.focus();
		textArea.select();

		try {
			document.execCommand( 'copy' );
			setCopySuccess( true );
		} catch ( err ) {
			setError( __( 'Failed to copy to clipboard', 'wordpress-mcp' ) );
		}

		// Clean up
		document.body.removeChild( textArea );
	};

	const formatDate = ( timestamp ) => {
		return format( new Date( timestamp * 1000 ), 'PPpp' );
	};

	// UPDATED: Format duration s podporou "never"
	const formatDuration = ( value ) => {
		if ( value === 'never' || value === null ) {
			return __( 'Never expires', 'wordpress-mcp' );
		}
		
		const seconds = parseInt( value );
		if ( isNaN( seconds ) ) {
			return __( 'Never expires', 'wordpress-mcp' );
		}
		
		const hours = Math.floor( seconds / 3600 );
		if ( hours >= 24 ) {
			const days = Math.floor( hours / 24 );
			return days === 1
				? __( '1 day', 'wordpress-mcp' )
				: `${ days } ${ __( 'days', 'wordpress-mcp' ) }`;
		}
		return hours === 1
			? __( '1 hour', 'wordpress-mcp' )
			: `${ hours } ${ __( 'hours', 'wordpress-mcp' ) }`;
	};

	return (
		<div className="mcp-settings-tab">
			<Card>
				<CardBody>
					<h2>{ __( 'Authentication Tokens', 'wordpress-mcp' ) }</h2>

					<div
						className="mcp-info-section"
						style={ {
							marginBottom: '24px',
							padding: '16px',
							backgroundColor: '#f9f9f9',
							border: '1px solid #ddd',
							borderRadius: '4px',
						} }
					>
						<h3>
							{ __(
								'What are Authentication Tokens?',
								'wordpress-mcp'
							) }
						</h3>
						<p>
							{ __(
								'MCP authentication tokens are secure, temporary credentials that allow external MCP clients to the WordPress MCP server',
								'wordpress-mcp'
							) }
						</p>

						<p>
							{ __(
								'These tokens are implemented using JWT (JSON Web Tokens), providing secure and stateless authentication.',
								'wordpress-mcp'
							) }
						</p>

						<h4>{ __( 'How They Work', 'wordpress-mcp' ) }</h4>
						<ul style={ { marginLeft: '20px' } }>
							<li>
								{ __(
									'Tokens are generated with your current user permissions and expire automatically',
									'wordpress-mcp'
								) }
							</li>
							<li>
								{ __(
									'They provide access to MCP route endpoints for your WordPress content',
									'wordpress-mcp'
								) }
							</li>
							<li>
								{ __(
									'Each token is unique and can be revoked individually if compromised',
									'wordpress-mcp'
								) }
							</li>
							<li>
								{ __(
									'Tokens automatically inherit your user role and capabilities',
									'wordpress-mcp'
								) }
							</li>
						</ul>

						<h4>
							{ __( 'Security Best Practices', 'wordpress-mcp' ) }
						</h4>
						<div
							style={ {
								padding: '12px',
								backgroundColor: '#fff3cd',
								border: '1px solid #ffeaa7',
								borderRadius: '4px',
								marginBottom: '12px',
							} }
						>
							<strong>
								{ __(
									'⚠️ Important Security Notes:',
									'wordpress-mcp'
								) }
							</strong>
							<ul
								style={ {
									marginLeft: '20px',
									marginTop: '8px',
								} }
							>
								<li>
									{ __(
										'Never share tokens in public repositories, emails, or chat messages',
										'wordpress-mcp'
									) }
								</li>
								<li>
									{ __(
										'Use the shortest expiration time that meets your needs',
										'wordpress-mcp'
									) }
								</li>
								<li>
									{ __(
										'Revoke tokens immediately if you suspect they may be compromised',
										'wordpress-mcp'
									) }
								</li>
								<li>
									{ __(
										'Regularly review and clean up unused or expired tokens',
										'wordpress-mcp'
									) }
								</li>
							</ul>
						</div>

						{/* NOVÉ: Never-expiring tokens warning */}
						<div
							style={ {
								padding: '12px',
								backgroundColor: '#f8d7da',
								border: '1px solid #f5c6cb',
								borderRadius: '4px',
								marginTop: '12px',
								marginBottom: '12px',
							} }
						>
							<strong>
								{ __( '🚨 Never-Expiring Tokens:', 'wordpress-mcp' ) }
							</strong>
							<ul style={ { marginLeft: '20px', marginTop: '8px' } }>
								<li>
									{ __(
										'Should only be used in highly controlled environments',
										'wordpress-mcp'
									) }
								</li>
								<li>
									{ __(
										'Must be manually revoked if compromised',
										'wordpress-mcp'
									) }
								</li>
								<li>
									{ __(
										'Consider using long-lived tokens (24 hours) instead',
										'wordpress-mcp'
									) }
								</li>
								<li>
									{ __(
										'Regularly audit and rotate never-expiring tokens',
										'wordpress-mcp'
									) }
								</li>
							</ul>
						</div>

						<div
							style={ {
								padding: '12px',
								backgroundColor: '#e8f4fd',
								border: '1px solid #b3d9ff',
								borderRadius: '4px',
								marginTop: '12px',
								marginBottom: '12px',
							} }
						>
							<strong>
								{ __( 'ℹ️ Important Note:', 'wordpress-mcp' ) }
							</strong>
							<p
								style={ {
									marginTop: '8px',
									marginBottom: '0',
								} }
							>
								{ __(
									'These tokens are exclusively for MCP protocol access (stdio and streamable/HTTP). They will not work with WordPress REST API endpoints or other authentication systems.',
									'wordpress-mcp'
								) }
							</p>
						</div>

						<p
							style={ {
								marginTop: '16px',
								fontStyle: 'italic',
								color: '#666',
							} }
						>
							{ __(
								'Remember: These tokens provide access based on your user permissions. If you can see it in WordPress, applications using your token can see it too.',
								'wordpress-mcp'
							) }
						</p>
					</div>

					<p>
						{ __(
							'Generate tokens below to allow secure access to your WordPress content through the MCP protocol.',
							'wordpress-mcp'
						) }
					</p>

					<div className="mcp-form-field">
						<SelectControl
							label={ __( 'Token Duration', 'wordpress-mcp' ) }
							value={ selectedDuration }
							options={ durationOptions }
							onChange={ ( value ) => {
								// UPDATED: Handle both string and number values
								setSelectedDuration( value );
							} }
							help={ __(
								'Choose how long the token will remain valid',
								'wordpress-mcp'
							) }
						/>
					</div>

					{/* NOVÉ: Security warning for never expire */}
					{ selectedDuration === 'never' && (
						<div
							style={ {
								padding: '12px',
								backgroundColor: '#fff3cd',
								border: '1px solid #ffeaa7',
								borderRadius: '4px',
								marginBottom: '12px',
							} }
						>
							<strong>
								{ __(
									'⚠️ Security Warning:',
									'wordpress-mcp'
								) }
							</strong>
							<p style={ { marginTop: '8px', marginBottom: '0' } }>
								{ __(
									'Never-expiring tokens pose significant security risks. If compromised, they cannot be invalidated through expiration. Only use this option if you fully understand the security implications and have proper token management procedures in place.',
									'wordpress-mcp'
								) }
							</p>
						</div>
					) }

					<div className="mcp-form-field">
						<Button
							isPrimary
							onClick={ generateToken }
							isBusy={ loading }
							disabled={ loading }
						>
							{ __( 'Generate New Token', 'wordpress-mcp' ) }
						</Button>
					</div>

					{ error && (
						<div className="mcp-error-message">{ error }</div>
					) }

					{ token && (
						<div className="mcp-token-section">
							<div className="mcp-token-container">
								<h3>
									{ __( 'Generated Token', 'wordpress-mcp' ) }
								</h3>
								<TextareaControl
									readOnly
									value={ token.token }
									rows={ 4 }
								/>
								<div
									style={ {
										display: 'flex',
										alignItems: 'center',
										gap: '10px',
									} }
								>
									<Button
										isSecondary
										onClick={ () =>
											copyToClipboard( token.token )
										}
									>
										{ __( 'Copy', 'wordpress-mcp' ) }
									</Button>
									{ copySuccess && (
										<span style={ { color: '#00a32a' } }>
											{ __(
												'Token copied!',
												'wordpress-mcp'
											) }
										</span>
									) }
								</div>
								{/* UPDATED: Token description s podporou never expire */}
								<p className="description">
									{ token.expires_in === 'never' || token.never_expire
										? __( 'This token never expires', 'wordpress-mcp' )
										: token.expires_in
										? `${ __(
											  'Expires in',
											  'wordpress-mcp'
										  ) } ${ formatDuration(
											  token.expires_in
										  ) }`
										: __(
											  'Expires in 1 hour',
											  'wordpress-mcp'
										  ) }
									{ token.expires_at && ! (token.never_expire || token.expires_in === 'never') && (
										<span>
											{ ' (' }
											{ formatDate( token.expires_at ) }
											{ ')' }
										</span>
									) }
								</p>
							</div>
						</div>
					) }

					<div className="mcp-tokens-list">
						<h3>{ __( 'Your Active Tokens', 'wordpress-mcp' ) }</h3>
						<table className="wp-list-table widefat fixed striped">
							<thead>
								<tr>
									<th>{ __( 'User', 'wordpress-mcp' ) }</th>
									<th>
										{ __( 'Issued At', 'wordpress-mcp' ) }
									</th>
									<th>
										{ __( 'Expires At', 'wordpress-mcp' ) }
									</th>
									<th>{ __( 'Status', 'wordpress-mcp' ) }</th>
									<th>
										{ __( 'Actions', 'wordpress-mcp' ) }
									</th>
								</tr>
							</thead>
							<tbody>
								{ tokens.map( ( token ) => (
									<tr key={ token.jti }>
										<td>
											{ token.user.display_name }
											<br />
											<small style={ { color: '#666' } }>
												{ token.user.username }
											</small>
										</td>
										<td>
											{ formatDate( token.issued_at ) }
										</td>
										{/* UPDATED: Expires At column s podporou never expire */}
										<td>
											{ token.never_expire 
												? __( 'Never expires', 'wordpress-mcp' )
												: formatDate( token.expires_at ) 
											}
										</td>
										{/* UPDATED: Status column s podporou never expire */}
										<td>
											{ token.revoked
												? __(
														'Revoked',
														'wordpress-mcp'
												  )
												: token.never_expire
												? __(
														'Active (Never expires)',
														'wordpress-mcp'
												  )
												: token.is_expired
												? __(
														'Expired',
														'wordpress-mcp'
												  )
												: __(
														'Active',
														'wordpress-mcp'
												  ) }
										</td>
										<td>
											{ ! token.revoked &&
												! token.is_expired && (
													<Button
														isDestructive
														isSmall
														onClick={ () =>
															revokeToken(
																token.jti
															)
														}
													>
														{ __(
															'Revoke',
															'wordpress-mcp'
														) }
													</Button>
												) }
										</td>
									</tr>
								) ) }
							</tbody>
						</table>
					</div>
				</CardBody>
			</Card>
		</div>
	);
};

export default AuthenticationTokensTab;